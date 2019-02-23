const { ApolloServer, gql } = require('apollo-server');
const { fetchRepository, fetchDeveloper, fetchLanguage, refresh } = require('./fetch');

const typeDefs = gql`
    # schema
    type Trending {
        repositories: [Repository]
        developers: [Developer]
    }
    ## repository
    type Repository {
        author: String
        contributors: [Contributor]
        currentPeriodStars: Int
        description: String
        forks: Int
        language: Lang
        name: String
        stars: Int
        url: String
    }
    type Contributor {
        avatar: String
        url: String
        username: String
    }
    type Lang {
        name: String
        color: String
    }

    ## developer
    type Developer {
        avatar: String
        name: String
        repository: RepositoryMini
        username: String
        url: String
    }
    type RepositoryMini {
        description: String
        name: String
        url: String
    }

    ## language
    type Laguage {
        popular: [LaguageDetail]
        all: [LaguageDetail]
    }
    type LaguageDetail {
        urlParam: String
        name: String
    }

    # Query
    type Query {
        trending(language: String, since: String): Trending
        language: Laguage
    }

    # Mutation
    type Mutation {
        refresh(key: Key, language: String, since: String): Boolean
    }

    # input
    enum Key {
        repositories
        developers
    }
`;

const resolvers = {
    Trending: {
        repositories: async ({ language, since }) => fetchRepository({ language, since }),
        developers: async ({ language, since }) => fetchDeveloper({ language, since }),
    },
    Query: {
        trending(parent, { language = '', since = 'daily' }, context, info) {
            return {
                language,
                since
            };
        },
        language: async (parent, args, context, info) => fetchLanguage()
    },
    Mutation: {
        refresh: async (parent, { key = '', language = '', since = 'daily' }, context, info) => refresh({ key, language, since }),
    }
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    playground: true
});

server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});