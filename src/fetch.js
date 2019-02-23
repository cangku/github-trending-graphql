const fetch = require('node-fetch');
const fs = require('fs');
const cheerio = require('cheerio');
const cache = require('memory-cache');

const GITHUB_URL = 'https://github.com';
const TRENDING_URL = `${GITHUB_URL}/trending`;
const TRENDING_DEVELOPER_URL = `${TRENDING_URL}/developers`;

async function fetchRepository({
    language = '',
    since = 'daily'
} = {}) {
    console.log(+new Date);
    let repos = cache.get(`repositories-${language}-${since}`);
    if (repos) {
        return repos;
    }

    const REQUEST_URL = `${TRENDING_URL}/${language}?since=${since}`;
    let html;
    try {
        html = await fetch(REQUEST_URL).then(res => res.text());
    } catch ({ code = 'unknow' }) {
        throw new Error(`fetch ${REQUEST_URL} fail, error code: ${code}`);
    }
    // const html = fs.readFileSync(`${__dirname}/mock/trending.html`).toString();

    if (!cache.get(`language`)) {
        const data = getLanguage(html, language);
        cache.put(`language`, data, 24 * 60 * 60 * 1000);
    }

    const $ = cheerio.load(html);
    // fs.writeFileSync(`${__dirname}/mock/trending.html`, html);

    repos = $('.repo-list li')
        .map((i, el) => {
            const $li = $(el);
            let repo = {};

            // repository
            const $repository = $li.find('h3 a');
            const relativeUrl = $repository.attr('href');
            repo.url = `${GITHUB_URL}${relativeUrl}`;
            [repo.author, repo.name] = $repository
                .text()
                .trim()
                .split(' / ');

            // description
            repo.description = $li
                .children()
                .eq(2)
                .text()
                .trim();

            // language
            let language = {
                name: '',
                color: ''
            };
            language.name = $li
                .find('span[itemprop="programmingLanguage"]')
                .text()
                .trim();

            const languageStyle = $li
                .find('.repo-language-color')
                .attr('style');

            if (languageStyle) {
                language.color = languageStyle.match(/:(.*);/)[1];
            }
            repo.language = language;

            // stars
            repo.stars = parseInt(
                $li
                    .find(`a[href="${relativeUrl}/stargazers"]`)
                    .text()
                    .trim()
                    .replace(',', ''),
                10
            );

            // forks
            repo.forks = parseInt(
                $li
                    .find(`a[href="${relativeUrl}/network"]`)
                    .text()
                    .trim()
                    .replace(',', ''),
                10
            );

            // contributors
            repo.contributors = $li
                .find('a[data-hovercard-type="user"]')
                .map((i, el) => {
                    const $a = $(el);
                    let user = {};
                    user.url = `${GITHUB_URL}${$a.attr('href')}`;
                    const $img = $a.find('img');
                    user.avatar = $img.attr('src').split('?')[0];
                    user.username = $img.attr('alt').slice(1);
                    return user;
                })
                .get();

            // currentPeriodStars
            repo.currentPeriodStars = parseInt(
                $li
                    .children()
                    .last()
                    .children()
                    .last()
                    .text()
                    .trim()
                    .split(' ')[0]
                    .replace(',', ''),
                10
            );

            return repo;
        })
        .get();

    cache.put(`repositories-${language}-${since}`, repos, 60 * 60 * 1000);
    return repos;
}

async function fetchDeveloper({
    language = '',
    since = 'daily'
} = {}) {
    console.log(+new Date);
    let developers = cache.get(`developers-${language}-${since}`);
    if (developers) {
        return developers;
    }

    const REQUEST_URL = `${TRENDING_DEVELOPER_URL}/${language}?since=${since}`;
    let html;
    try {
        html = await fetch(REQUEST_URL).then(res => res.text());
    } catch ({ code = 'unknow' }) {
        throw new Error(`fetch ${REQUEST_URL} fail, error code: ${code}`);
    }
    // const html = fs.readFileSync(`${__dirname}/mock/developer.html`).toString();

    if (!cache.get(`language`)) {
        const data = getLanguage(html, language);
        cache.put(`language`, data, 24 * 60 * 60 * 1000);
    }

    const $ = cheerio.load(html);
    // fs.writeFileSync(`${__dirname}/mock/developer.html`, html);

    developers = $('.explore-content li')
        .map((i, el) => {
            const $li = $(el);
            let developer = {};

            // avatar
            developer.avatar = $li
                .find('img')
                .attr('src')
                .split('?')[0];

            // user
            const $a = $li.find('h2 a');
            const relativeUrl = $a.attr('href');
            developer.url = `${GITHUB_URL}${relativeUrl}`;
            [
                developer.username,
                developer.name = ''
            ] = $a
                .text()
                .trim()
                .split(/[\r\n]+\s+/);

            developer.name = developer
                .name
                .replace(/^\(|\)$/g, '');

            // repository
            let repository = {};
            const url = $li
                .find('.repo-snipit')
                .attr('href');

            repository.url = `${GITHUB_URL}${url}`;
            repository.name = $li
                .find('.repo-snipit-name')
                .text()
                .trim();

            repository.description = $li
                .find('.repo-snipit-description')
                .text()
                .trim();

            developer.repository = repository;

            return developer;
        })
        .get();

    cache.put(`developers-${language}-${since}`, developers, 60 * 60 * 1000);
    return developers;
}

async function fetchLanguage() {
    let language = cache.get(`language`);
    if (language) {
        return language;
    }

    let html;
    try {
        html = await fetch(TRENDING_URL).then(res => res.text());
    } catch ({ code = 'unknow' }) {
        throw new Error(`fetch ${TRENDING_URL} fail, error code: ${code}`);
    }

    language = getLanguage(html);

    cache.put(`language`, language, 24 * 60 * 60 * 1000);
    return language;
}

async function refresh({
    key = '',
    language = '',
    since = 'daily'
} = {}) {
    if (key) {
        return cache.del(`${key}-${language}-${since}`);
    }
    return cache.clear() || true;
}

// tool
function getLanguage(html, $language = '') {
    const $ = cheerio.load(html);
    let language = {
        all: [],
        popular: []
    };

    language.popular = $('.filter-list a')
        .slice(2)
        .map((i, el) => {
            const urlParam = $(el)
                .attr('href')
                .match(/trending\/?(developers\/)?(.*)\?/)[2];

            return {
                urlParam: urlParam || $language,
                name: $(el).text().trim()
            };
        })
        .get();

    language.all = $('div[data-filterable-for="text-filter-field"] a')
        .map((i, el) => {
            const urlParam = $(el)
                .attr('href')
                .match(/trending\/(developers\/)?(.*)\?/)[2];

            return {
                urlParam,
                name: $(el).text().trim()
            };
        })
        .get();

    return language;
}

module.exports = {
    fetchRepository,
    fetchDeveloper,
    fetchLanguage,
    refresh
}