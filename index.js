import fs from 'fs/promises';
import { Telegraf } from 'telegraf';
import { MongoClient } from 'mongodb';
import { getJobTitlesByFakeBrowser, getJobTitlesByAxios } from './jobTitleParser.js';

const MONGODB_URI = 'mongodb://mongo:27017';

const init = async () => {
  const config = JSON.parse(await fs.readFile('./config/default.json', 'utf8'));
  const jobSites = JSON.parse(await fs.readFile('./config/jobSites.json', 'utf8'));
  return { config, jobSites };
};

const parseJobSites = async (config, jobSites, telegramBot) => {
  const mongo = await MongoClient.connect(MONGODB_URI, {
    useNewUrlParser: true,
  });
  const db = mongo.db('jobnotifications');
  const viewedJobTitlesCollection = db.collection('viewedJobTitles');

  for await (const site of jobSites) {
    try {
      let jobTitles = [];
      if (site.antiBotCheck) {
        jobTitles = await getJobTitlesByFakeBrowser(site);
      } else {
        jobTitles = await getJobTitlesByAxios(site);
      }

      console.info(`Parsing ${site.name}'s job list`);
      if (jobTitles.length === 0) {
        console.info(`          ===============================`);
        console.info(`          ${site.name} has no job title`);
        console.info(`          ===============================`);
      }

      for (let i = 0; i < jobTitles.length; i++) {
        const jobTitle = jobTitles[i].toLowerCase().trim();

        const isMatchingJob = config.JOB_KEYWORDS.some((keyword) =>
          jobTitle.includes(keyword)
        );

        if (isMatchingJob) {
          console.info('          * Check if the job title has already been viewed');
          const isViewedJob = await viewedJobTitlesCollection.findOne({
            title: jobTitle,
            site: site.url,
          });
          if (!isViewedJob) {
            const message = `      🚀🚀🚀New ${jobTitle.toUpperCase()} job found on ${site.name}: ${site.url}`;
            console.info(message);
            console.info('                    Sending data to Telegram chanel');
            await telegramBot.telegram.sendMessage(config.TELEGRAM.CHAT_ID, message);
            console.info('                    Insert data to DB as viewed job title');
            await viewedJobTitlesCollection.insertOne({
              title: jobTitle,
              site: site.url,
              date: new Date(),
            });
          }
        }
      }
    } catch (error) {
      console.error(error);
      continue;
    }
  }
  await mongo.close();

  // Trigger garbage collection
  if (global.gc) {
    global.gc();
  }
};

(async () => {
  const { config, jobSites } = await init();
  const telegramBot = new Telegraf(config.TELEGRAM.TOKEN);
  telegramBot.startPolling();

  await parseJobSites(config, jobSites, telegramBot);
  setInterval(async () => {
    await parseJobSites(config, jobSites);
  }, config.SCAN_INTERVAL_MINUTES * 60 * 1000);
})();
