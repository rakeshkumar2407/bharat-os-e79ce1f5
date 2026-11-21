#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <limine.h>

__attribute__((used, section(".limine_requests")))
static volatile uint64_t base_revision[] = LIMINE_BASE_REVISION(6);

__attribute__((used, section(".limine_requests")))
static volatile struct limine_framebuffer_request framebuffer_request = {
    .id = LIMINE_FRAMEBUFFER_REQUEST_ID,
    .revision = 0,
};

__attribute__((used, section(".limine_requests")))
static volatile struct limine_firmware_type_request firmware_request = {
    .id = LIMINE_FIRMWARE_TYPE_REQUEST_ID,
    .revision = 0,
};

__attribute__((used, section(".limine_requests_start")))
static volatile uint64_t requests_start[] = LIMINE_REQUESTS_START_MARKER;

__attribute__((used, section(".limine_requests_end")))
static volatile uint64_t requests_end[] = LIMINE_REQUESTS_END_MARKER;

static const uint8_t font[26][7] = {
    ['A' - 'A'] = {14, 17, 17, 31, 17, 17, 17},
    ['B' - 'A'] = {30, 17, 17, 30, 17, 17, 30},
    ['E' - 'A'] = {31, 16, 16, 30, 16, 16, 31},
    ['H' - 'A'] = {17, 17, 17, 31, 17, 17, 17},
    ['I' - 'A'] = {31, 4, 4, 4, 4, 4, 31},
    ['K' - 'A'] = {17, 18, 20, 24, 20, 18, 17},
    ['L' - 'A'] = {16, 16, 16, 16, 16, 16, 31},
    ['N' - 'A'] = {17, 25, 25, 21, 19, 19, 17},
    ['O' - 'A'] = {14, 17, 17, 17, 17, 17, 14},
    ['R' - 'A'] = {30, 17, 17, 30, 20, 18, 17},
    ['S' - 'A'] = {15, 16, 16, 14, 1, 1, 30},
    ['T' - 'A'] = {31, 4, 4, 4, 4, 4, 4},
};

static inline void outb(uint16_t port, uint8_t value) {
    __asm__ volatile ("outb %0, %1" : : "a"(value), "Nd"(port));
}

static inline uint8_t inb(uint16_t port) {
    uint8_t value;
    __asm__ volatile ("inb %1, %0" : "=a"(value) : "Nd"(port));
    return value;
}

static void serial_init(void) {
    outb(0x3f8 + 1, 0x00);
    outb(0x3f8 + 3, 0x80);
    outb(0x3f8 + 0, 0x03);
    outb(0x3f8 + 1, 0x00);
    outb(0x3f8 + 3, 0x03);
    outb(0x3f8 + 2, 0xc7);
    outb(0x3f8 + 4, 0x0b);
}

static void serial_write(const char *text) {
    for (; *text; ++text) {
        for (uint32_t wait = 0; wait < 100000; ++wait) {
            if (inb(0x3f8 + 5) & 0x20) {
                outb(0x3f8, (uint8_t)*text);
                break;
            }
        }
    }
}

static __attribute__((noreturn)) void halt(void) {
    for (;;) {
        __asm__ volatile ("hlt");
    }
}

static uint32_t channel(uint8_t value, uint8_t size, uint8_t shift) {
    uint64_t max = (1ULL << size) - 1;
    return (uint32_t)(((uint64_t)value * max / 255) << shift);
}

static uint32_t pixel(struct limine_framebuffer *fb, uint8_t red, uint8_t green, uint8_t blue) {
    return channel(red, fb->red_mask_size, fb->red_mask_shift)
        | channel(green, fb->green_mask_size, fb->green_mask_shift)
        | channel(blue, fb->blue_mask_size, fb->blue_mask_shift);
}

static void fill_rect(struct limine_framebuffer *fb, uint64_t x, uint64_t y, uint64_t w, uint64_t h, uint32_t colour) {
    volatile uint32_t *base = fb->address;
    uint64_t stride = fb->pitch / sizeof(uint32_t);
    for (uint64_t row = y; row < y + h && row < fb->height; ++row) {
        for (uint64_t col = x; col < x + w && col < fb->width; ++col) {
            base[row * stride + col] = colour;
        }
    }
}

static void draw_text(struct limine_framebuffer *fb, const char *text, uint64_t x, uint64_t y, uint32_t scale, uint32_t colour) {
    for (; *text; ++text) {
        if (*text == ' ') {
            x += 6 * scale;
            continue;
        }
        if (*text >= 'A' && *text <= 'Z') {
            const uint8_t *glyph = font[(uint8_t)*text - 'A'];
            for (uint64_t row = 0; row < 7; ++row) {
                for (uint64_t col = 0; col < 5; ++col) {
                    if (glyph[row] & (1u << (4 - col))) {
                        fill_rect(fb, x + col * scale, y + row * scale, scale, scale, colour);
                    }
                }
            }
        }
        x += 6 * scale;
    }
}

static void draw_splash(struct limine_framebuffer *fb) {
    const uint32_t background = pixel(fb, 11, 20, 38);
    const uint32_t saffron = pixel(fb, 255, 153, 51);
    const uint32_t white = pixel(fb, 245, 245, 240);
    const uint32_t green = pixel(fb, 19, 136, 8);

    fill_rect(fb, 0, 0, fb->width, fb->height, background);
    fill_rect(fb, 0, 0, fb->width, 5, saffron);
    fill_rect(fb, 0, 5, fb->width, 3, white);
    fill_rect(fb, 0, 8, fb->width, 5, green);

    const char *title = "BHARAT OS";
    const char *status = "KERNEL ONLINE";
    const uint64_t title_width = 9 * 6 * 3;
    const uint64_t status_width = 13 * 6 * 2;
    draw_text(fb, title, (fb->width - title_width) / 2, fb->height / 2 - 30, 3, white);
    draw_text(fb, status, (fb->width - status_width) / 2, fb->height / 2 + 8, 2, saffron);
}

void kernel_main(void) {
    serial_init();
    serial_write("\r\nBharat OS: kernel entry reached.\r\n");

    if (!LIMINE_BASE_REVISION_SUPPORTED(base_revision)) {
        serial_write("Bharat OS: unsupported Limine base revision.\r\n");
        halt();
    }

    if (framebuffer_request.response == NULL ||
        framebuffer_request.response->framebuffer_count == 0) {
        serial_write("Bharat OS: no framebuffer was provided.\r\n");
        halt();
    }

    struct limine_framebuffer *fb = framebuffer_request.response->framebuffers[0];
    if (fb == NULL || fb->memory_model != LIMINE_FRAMEBUFFER_RGB || fb->bpp != 32) {
        serial_write("Bharat OS: unsupported framebuffer format.\r\n");
        halt();
    }

    draw_splash(fb);
    if (firmware_request.response != NULL) {
        serial_write(firmware_request.response->firmware_type == LIMINE_FIRMWARE_TYPE_X86BIOS
            ? "Bharat OS: booted with BIOS.\r\n"
            : "Bharat OS: booted with UEFI.\r\n");
    }
    serial_write("Bharat OS: framebuffer initialized; kernel is idle.\r\n");

    halt();
}
