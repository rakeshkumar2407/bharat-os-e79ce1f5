CC = x86_64-elf-gcc
CFLAGS = -std=gnu11 -O2 -Wall -Wextra -ffreestanding -fno-stack-protector -fno-pic -fno-pie -fno-asynchronous-unwind-tables -m64 -march=x86-64 -mno-red-zone -mno-mmx -mno-sse -mcmodel=kernel
LDFLAGS = -nostdlib -static -Wl,--build-id=none -Wl,-z,max-page-size=0x1000 -Wl,-T,linker.ld -Wl,-m,elf_x86_64

BUILD := build
PROTOCOL_DIR := vendor/limine-protocol
PROTOCOL_COMMIT := 6e85ddd6f928b5b512015c4d47d1cfce2fd28079
LIMINE_DIR := $(BUILD)/limine-binary
LIMINE := $(LIMINE_DIR)/limine
KERNEL := $(BUILD)/kernel.elf
ISO_ROOT := $(BUILD)/iso_root
ISO := $(BUILD)/bharat-os.iso
LIMINE_BINARY_URL := https://github.com/Limine-Bootloader/Limine/releases/latest/download/limine-binary.tar.gz
OVMF_CODE ?= /usr/share/OVMF/OVMF_CODE.fd
QEMU ?= qemu-system-x86_64

.PHONY: all deps iso run-bios run-uefi clean

all: iso

deps:
	mkdir -p $(BUILD) vendor
	if [ ! -f $(PROTOCOL_DIR)/include/limine.h ]; then \
		git clone --no-checkout https://github.com/Limine-Bootloader/limine-protocol.git $(PROTOCOL_DIR); \
		git -C $(PROTOCOL_DIR) checkout --detach $(PROTOCOL_COMMIT); \
	fi
	if [ ! -x $(LIMINE) ]; then \
		curl -fL $(LIMINE_BINARY_URL) -o $(BUILD)/limine-binary.tar.gz; \
		tar -xzf $(BUILD)/limine-binary.tar.gz -C $(BUILD); \
	fi

$(KERNEL): src/kernel.c linker.ld | deps
	mkdir -p $(BUILD)
	$(CC) $(CFLAGS) -I$(PROTOCOL_DIR)/include src/kernel.c $(LDFLAGS) -o $@

$(LIMINE): | deps
	test -x $@

$(ISO): $(KERNEL) $(LIMINE) limine.conf
	rm -rf $(ISO_ROOT)
	mkdir -p $(ISO_ROOT)/boot/limine $(ISO_ROOT)/EFI/BOOT
	cp $(KERNEL) $(ISO_ROOT)/boot/kernel.elf
	cp limine.conf $(ISO_ROOT)/boot/limine/limine.conf
	cp $(LIMINE_DIR)/limine-bios.sys $(LIMINE_DIR)/limine-bios-cd.bin $(LIMINE_DIR)/limine-uefi-cd.bin $(ISO_ROOT)/boot/limine/
	cp $(LIMINE_DIR)/BOOTX64.EFI $(LIMINE_DIR)/BOOTIA32.EFI $(ISO_ROOT)/EFI/BOOT/
	xorriso -as mkisofs -R -r -J -b boot/limine/limine-bios-cd.bin -no-emul-boot -boot-load-size 4 -boot-info-table \
		--efi-boot boot/limine/limine-uefi-cd.bin --efi-boot-part --efi-boot-image --protective-msdos-label \
		$(ISO_ROOT) -o $(ISO)
	$(LIMINE) bios-install $(ISO)

iso: $(ISO)

run-bios: $(ISO)
	$(QEMU) -cdrom $(ISO) -boot d -m 512M -serial stdio

run-uefi: $(ISO)
	$(QEMU) -cdrom $(ISO) -bios $(OVMF_CODE) -m 512M -serial stdio

clean:
	rm -rf $(BUILD)
