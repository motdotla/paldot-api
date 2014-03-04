# [paldot-api](https://paldot.github.com) API Documentation

## Installation

### Heroku

```bash
git clone https://github.com/paldot/paldot-api.git
cd paldot-api
heroku create paldot-api
heroku config:set TWITTER_CONSUMER_KEY=something
heroku config:set TWITTER_CONSUMER_SECRET=something
heroku config:set ROOT_URL=https://paldot.github.com
heroku addons:add sendgrid
heroku addons:add redistogo
git push heroku master
heroku config:set FROM=login@paldot.org
```

### Development

```bash
git clone https://github.com/paldot/paldot-api.git
cd paldot-api
cp .env.example .env
```



