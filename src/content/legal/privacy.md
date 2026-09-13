---
title: Privacy policy
description: 'How Gleamit handles your data: there is no Gleamit account and no Gleamit backend, and everything you record stays on your device.'
version: 6
effective: 2026-09-13
---

Gleamit helps you track oral hygiene habits. It is developed by **Lorenzo
Zabot, Milan, Italy** ("we", "us").

## The short version

There is **no Gleamit account and no Gleamit backend**. Your data is stored on
your device and never reaches us. There are no ads, no analytics, and no
tracking SDKs. The app talks to a third party in only two cases:

- the optional one-time "Pro" purchase, including the check at start-up for a
  purchase you already own, and
- the optional **cloud backup**, off until you turn it on, which puts a copy of
  your data in cloud storage of your own - never in ours.

## What is stored on your device

Everything you record: brushing and floss sessions (with timestamps, dates and
time zone), streaks and derived statistics, reminders, toothbrushes and brush
heads, dentist and appointment details, your tooth map with its change history,
the dentist documents and smile photos you attach, the name for your dentist
report, app preferences, your cloud backup settings (including the Google
account you connected on Android and when the last backup ran or failed), and a
local flag recording whether "Pro" is active.

We have no access to any of it.

## Website

This website, **gleamit.app**, is a set of static pages hosted on GitHub Pages.
It sets **no cookies**, runs **no analytics**, and loads no third-party
scripts, fonts or embeds. We collect nothing about your visit beyond the
ordinary server logs GitHub keeps as our hosting provider, and we do not use
them to build any profile of you.

The light and dark theme control stores a single preference in your browser's
local storage. It stays in your browser, never leaves your device, and is not
sent to us or to anyone else. Clearing your browser's site data removes it.

- GitHub: [docs.github.com/site-policy](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement)

## In-app purchases

"Pro" is a single optional one-time purchase, handled by your app store's
billing system (Google Play Billing or the Apple App Store) and by
**RevenueCat**, which validates and manages it. What they process is the app
store's purchase token and product identifier, an anonymous app-generated
identifier from the RevenueCat SDK (linked to no account, because there is
none), and technical device and network information used to validate the
receipt and prevent fraud. The same check runs at start-up so a purchase you
already made is recognised after a reinstall. Your oral hygiene data is
**never** part of it.

- Google Play: [policies.google.com/privacy](https://policies.google.com/privacy)
- Apple: [apple.com/legal/privacy](https://www.apple.com/legal/privacy/)
- RevenueCat: [revenuecat.com/privacy](https://www.revenuecat.com/privacy/)

## Cloud backup

Your device's own system backup does **not** include Gleamit's data: app backup
is off on Android, and on iOS Gleamit's working files are excluded from the
iCloud device backup. Gleamit's own cloud backup is a separate copy it makes on
purpose, and it is off until you turn it on.

With it on, Gleamit copies your tracking records, your dentist documents and
your smile photos into storage you control, on the frequency you choose (daily,
weekly, monthly, or manually with "Back up now") and only when there is new
data. You can leave photos or documents out; turning one off also removes it
from that storage. Only the latest copy is kept.

**On iOS** it goes to Gleamit's private area of **your iCloud Drive**, hidden
from the Files app so it cannot be moved or deleted by accident. Gleamit writes
the files; **iCloud uploads them**, under your own Apple Account and Apple's
terms, on your iCloud network settings. Gleamit reads iCloud's upload state and
tells you in the app when a backup is still waiting to upload or when iCloud
could not upload it.

**On Android** it goes to the hidden, app-scoped area of **your own Google
Drive** (the "app data" folder), which only Gleamit can see and which never
appears in your Drive file list. You connect a Google account in the app;
sign-in is handled by Google and asks for a single permission, that app-scoped
area (`drive.appdata`). Gleamit receives your account's email address, to show
you which account holds the backup, and an access token kept on your device. It
can see no other file in your Drive. Gleamit uploads the backup itself, so it
can tell you when your data actually arrived. Automatic backups run when you
leave the app and will not start on mobile data unless you turn on "Back up
using mobile data" - otherwise they wait for the next time you leave the app on
Wi-Fi. An upload already under way finishes on whatever connection the device
moves to. "Back up now" runs immediately on the connection you have, and a run
you asked for is retried the same way, mobile data included.

Worth knowing:

- **The files are not encrypted by Gleamit.** They are ordinary readable files
  in your own storage, like an archive you export yourself. Apple and Google
  encrypt them in transit and at rest as they do everything else, but there is
  no end-to-end encryption and no passphrase.
- **Disconnecting Gleamit in Google Drive deletes the backup.** The app-scoped
  area belongs to the app: removing Gleamit under "Manage apps" in your Google
  Account deletes the hidden backup with it. That is also how you delete it
  deliberately.
- **Switching or disconnecting the account inside Gleamit deletes nothing.** A
  different account only points future backups elsewhere; disconnecting just
  turns cloud backup off. Nothing in the app deletes a remote backup on its
  own, except the media parts you exclude.
- **Backups can stop.** Full cloud storage, withdrawn access to your Google
  account, iCloud Drive off for Gleamit, or - on Android - your device's power
  saving or a manufacturer's app sleep setting can hold them back indefinitely.
  Gleamit surfaces this in the app instead of failing quietly, but it cannot
  fix it for you.
- **Restoring happens in the app.** On a new device you install Gleamit and
  restore yourself; the operating system will not bring the data back.
- **Turning cloud backup off** stops future backups. The copy already in your
  storage stays until you delete it.

## Notifications

Reminders use **local notifications** scheduled on your device. There are no
remote push notifications and no notification server.

## Sharing

Because your data stays on your device, we do not use it: the app uses it
locally to run its features. We do not profile, advertise, sell, rent, or
share. The only third parties are the ones above - your app store and
RevenueCat for the purchase, and, only if you enable cloud backup, Apple or
Google holding your copy under your own account and their terms.

## Exporting your data

You can export a full backup archive (tracking records, documents and photos)
and generate a dentist report PDF. Both are created on your device and shared
by you through your device's own sharing options. They are not sent to us, and
you decide who receives them.

## Retention and deletion

Your data stays on your device until you remove it: delete items in the app,
clear the app's storage, or uninstall. If you turned cloud backup on, the copy
stays in your own cloud storage until you delete it there - on iOS in your
iCloud settings, on Android by disconnecting Gleamit in your Google Drive
settings.

## Your rights (EU/GDPR)

For the data you record we are not a data controller: it never reaches us, so
we could not access, correct, export or delete it even on request. The sections
above explain how you do that yourself.

For the optional purchase we are the controller, with RevenueCat as processor;
your app store handles payment data under its own terms. The legal basis is
performance of a contract (Article 6(1)(b) GDPR), the data is limited to what
is listed above, and it serves no other purpose. You have the rights of access,
rectification, erasure, restriction, portability and objection over that
purchase data - write to the address below. You may also complain to a
supervisory authority, in Italy the Garante per la Protezione dei Dati
Personali.

## Medical disclaimer

**Gleamit is not a medical device and does not give dental advice.** It records
what you log and shows it back to you; it never assesses the health information
you enter. Always consult your dental health professional. The full disclaimer
is in our [Terms and conditions](/terms/).

## Children's privacy

Gleamit is a general-audience app, not directed to children, and we knowingly
collect no personal information from them. With no account and no server of
ours, anything entered stays on the device, under the control of its owner.

## Changes

We may update this policy. Each change gets a new version number and effective
date, both shown at the top of this page. Earlier versions stay in the public
source history of this website.

## Contact

**Email:** [lorenzozabot@gmail.com](mailto:lorenzozabot@gmail.com)
