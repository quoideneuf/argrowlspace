Growl / OSX Notifications for ArchivesSpace
============================================

Get notified whenever a record is updated in ArchivesSpace

## Install and Setup (OSX 10.8+)

Install node, terminal-notifier, and this:

```bash
% brew install node
% brew install terminal-notifier
% npm install argrowlspace -g
```

Find out the url of your **backend** ArchivesSpace server and run:

```bash
% argrowlspace setup
$ ASpace backend url: <ENTER YOUR BACKEND URL>
$ ASpace username: <ENTER YOUR USERNAME>
$ ASpace password: <WONT BE SAVED ANYWHERE>
% You\'re logged in!
```
Now to start getting notifications:

```bash
$ asgrowlspace start
```

and to stop getting notifications:

```bash
$ asgrowlspace stop
```

Enjoy.



