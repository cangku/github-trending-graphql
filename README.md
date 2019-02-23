# Github Trending GraphQL API

It's a unofficial Trending API of GraphQL API v4. [online demo](https://trending.now.sh)  
I would describle the trending type as:

```graphql
type Trending {
    repositories: [Repository]
    developers: [Developer]
}

type Language {
    all: [LaguageDetail],
    popular: [LaguageDetail]
}
```
--- 

## Fields

> trending (Trending)

|Argument|type|description|
|---|---|---|
|language|String|eg. javascript|
|since|String|default daily, adjust time in ['daily', 'weekly', 'monthly']|

`repositories` and `developers` Detailed schema can be viewed [here](https://trending.now.sh).

## query example
```graphql
{
  Trending(language: "javascript", since: "daily") {
    repositories {
      name
      author
      description
      language {
        name
        color
      }
      forks
      stars
      contributors {
        avatar
        url
        username
      }
      currentPeriodStars
      url
    }
    developers {
      avatar
      name
      repository {
        url
        name
        description
      }
      username
      url
    }
  }
}
```

## Related
* [github trending rest api](https://github.com/huchenme/github-trending-api)

## License
MIT