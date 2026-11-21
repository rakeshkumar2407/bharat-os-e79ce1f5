# Bharat OS kernel prototype

This is a separate, freestanding x86_64 kernel foundation. It boots through
Limine on BIOS and UEFI, initializes a framebuffer splash screen, and writes
diagnostic output to the first serial port. It does not yet include a shell,
keyboard input, storage, networking, process scheduling, or Windows
compatibility. Those require separate kernel and driver work.

## Build and run

Use a Linux environment or WSL2. The ISO build needs GNU Make, Git, cURL,
`xorriso`, and an `x86_64-elf` GCC/binutils toolchain. Running it needs
`qemu-system-x86_64`; UEFI emulation also needs an OVMF firmware image.

From the repository root:

```sh
cd kernel
make
make run-bios
make run-uefi OVMF_CODE=/usr/share/OVMF/OVMF_CODE.fd
```

The first build fetches the pinned Limine protocol headers and the official
Limine binary release. The resulting hybrid ISO is `kernel/build/bharat-os.iso`.
The serial log is attached to the QEMU terminal. Set `CC` to a compatible
freestanding compiler command if your cross-compiler uses a different name.

Do not boot experimental kernel images on a physical computer. Use QEMU until
hardware support and recovery procedures have been implemented and tested.
