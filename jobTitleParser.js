import axios from 'axios';
import cheerio from 'cheerio';
import { faker } from '@faker-js/faker';
import { FakeBrowser } from 'fakebrowser';

const getJobTitlesByFakeBrowser = async (site) => {

  const builder = new FakeBrowser.Builder()
    .displayUserActionLayer(true)
    .vanillaLaunchOptions({
      headless: true,
    })
    .userDataDir('./fakeBrowserUserData');

  const fakeBrowser = await builder.launch();
  let jobTitles = [];

  try {
    const page = await fakeBrowser.vanillaBrowser.newPage();
    await page.goto(site.url, {waitUntil: 'domcontentloaded'});
    await page.waitForSelector(site.jobTitleSelector);
    jobTitles = await page.$$eval(site.jobTitleSelector,
      elements=> elements.map(item=>item.textContent))

  } finally {
    await fakeBrowser.shutdown();
  }
  return jobTitles
}

const getJobTitlesByAxios = async (site) => {
  try{
    const response = await axios.get(site.url, { headers: { 'User-Agent': faker.internet.userAgent() }  });
    const html = response.data;
    const $ = await cheerio.load(html);

    let jobTitles = [];
    const jobTitlesElements = await $(site.jobTitleSelector);
    for (let i = 0; i < jobTitlesElements.length; i++) {
      jobTitles[i] = $(jobTitlesElements[i]).text();
    }
    return jobTitles;
  }
  catch (error) {
    console.error(`===============================Parsing ${site.name} returned ERROR:${error}===============================`);
    return [];
  }
}

export { getJobTitlesByFakeBrowser, getJobTitlesByAxios };
