# [paldot-api](https://paldot.github.com) API Documentation

## Installation

### Heroku

```bash
git clone https://github.com/paldot/paldot-api.git
cd paldot-api
cp .env.example .env
heroku create paldot-api
heroku addons:add sendgrid
heroku addons:add redistogo
git push heroku master
heroku config:set FROM=login@paldot.org
```

