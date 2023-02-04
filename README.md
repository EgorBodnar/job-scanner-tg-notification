# Job scanner with alert telegram notification

## 📜Description: 
#### The scanner has a storage for previously viewed job posts to prevent duplicate notifications. It will only send notifications for new job postings.

## 🧰 Required settings and dependencies:
* Install the [**Docker Compose**](https://docs.docker.com/compose/gettingstarted) 

 *No additional installations or configurations are required on your computer.*
 
This means it operates independently of your technology stack and doesn't add any unnecessary bloat to your system.

## ⚙️ Job scanner configuration: 
* Define the list of required keywords to match when parsing the job title in `JOB_KEYWORDS` `config/default.json`
* Set Telegram bot token. `TELEGRAM.TOKEN` `config/default.json`| [**How to generate the TOKEN**](https://medium.com/geekculture/generate-telegram-token-for-bot-api-d26faf9bf064)
* Set id of the Telegram chat to send job alerts to. `TELEGRAM.CHAT_ID` `config/default.json`| Don't forget to add the bot to this chat.
* Extend the Job Sites list by the required ones in `config/jobSites.json`. Note: `jobTitleSelector` - css selector of the job post title. 

## ▶️ How to start the scanner:
* run `docker compose up`
* If you have changed some data, but the scanner is already running. Then stop it and restart it by rebuilding `docker-compose up --build --force-recreate`

## 🎥 Demo how it works
![ Scanner in work](scannerInWork.gif)