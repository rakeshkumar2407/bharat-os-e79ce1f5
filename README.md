# Bharat OS

build a operating system in assembly language in c, c++ and to related their tools to make operating system in used for real worl for real user so make like fully working os is Bharat os with fully working make that to work user on all activety like windows and bharat os make uniuqe degien with UI/UX  uiniques for bharat os with function to windows likw make like fully woking

This project was built with [Lovable](https://lovable.dev).

## First launch

New installs open a setup wizard to choose a language, time zone, account name,
password, wallpaper, and accent colour. The password is stored as a salted hash
and unlocks this browser's Bharat OS session; it does not encrypt files or secure
the browser profile. Existing installs continue to the usual sign-in screen and
can add a password under Settings → Account. App icon styles can be changed
later under Settings → Personalisation.

## Native kernel prototype

The browser-based desktop is separate from the experimental x86_64 kernel
foundation in [`kernel/`](./kernel/). The kernel currently targets booting
through both BIOS and UEFI; see its README for prerequisites and build/run
instructions. It is an early bootable prototype, not a replacement for Windows.

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c498ca36-5dd4-4a18-aa26-d929334d1eb8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
