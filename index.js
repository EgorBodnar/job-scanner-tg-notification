import fs from 'fs';
import { Telegraf } from 'telegraf';
import { MongoClient } from 'mongodb';
import { getJobTitlesByFakeBrowser, getJobTitlesByAxios }  from './jobTitleParser.js';

const MONGODB_URI = 'mongodb://mongo:27017';

const config = JSON.parse(fs.readFileSync('./config/default.json', 'utf8'));
const jobSites = JSON.parse(fs.readFileSync('./config/jobSites.json', 'utf8'));

const telegramBot = new Telegraf(config.TELEGRAM.TOKEN);

const parseJobSites = async () => {
  const mongo = await MongoClient.connect(MONGODB_URI, {
    useNewUrlParser: true,
  });
  const db = mongo.db('jobnotifications');
  const viewedJobTitles = db.collection('viewedJobTitles');

  for (const site of jobSites) {
    try {
      let jobTitles = [];
      if ( site.antiBotCheck ) {
        jobTitles = await getJobTitlesByFakeBrowser(site)
      } else {
        jobTitles = await getJobTitlesByAxios(site)
      }

      console.info(`Parsing ${site.name}'s job list`);

      for (let i = 0; i < jobTitles.length; i++) {
        const jobTitle = jobTitles[i].toLowerCase().trim()

        const isMatchingJob = config.JOB_KEYWORDS.some((keyword) =>
          jobTitle.includes(keyword)
        );

        if (isMatchingJob) {
          console.info('Check if the job title has already been viewed');
          const isViewedJob = await viewedJobTitles.findOne({
            title: jobTitle,
            site: site.url,
          });
          if (!isViewedJob) {
            const message = `New ${jobTitle.toUpperCase()} job found on ${site.name}: ${site.url}`;
            console.info(message);
            console.info('Sending data to Telegram chanel');
            await telegramBot.telegram.sendMessage(config.TELEGRAM.CHAT_ID, message);
            console.info('Insert data to DB as viewed job title');
            await viewedJobTitles.insertOne({
              title: jobTitle,
              site: site.url,
            });
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
}

(async () => {
  telegramBot.startPolling();
  await parseJobSites();
  setInterval(async () => {
    await parseJobSites();
  }, config.SCAN_INTERVAL_MINUTES * 60 * 1000);
})();
