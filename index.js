const { ApolloServer, gql } = require('apollo-server');
import faunadb, { query as q } from "faunadb"

var client = new faunadb.Client({ secret: process.env.fauna });

const { If, Paginate, Match, Map, Ref, Get, Index, Delete, CreateDatabase, CreateKey, Database, CreateIndex, Class, Create,  Update, CreateClass, Lambda, Var } = q

// First createindex
// console.log({newIndex})
// let index = CreateIndex({
//   name: "all_logs",
//   source: Class("Logs")
// })
// const newIndex = client.query(index)
// Paginate(input, [ts], [after], [before], [size], [events], [sources])

const typeDefs = gql`
  type Log {
    id: String
    title: String
    rating: Int
  }

  type Query {
    logs: [Log!]!
    log(id: String): Log
  }
  type Mutation {
    editLog(id: String!, title: String!): Log!
    deleteLog(id: String!): Log!
    addLog(title: String!, rating: Int!): Log!
  }
`;


// C ✅
// R ✅
// U ✅
// D ✅

const resolvers = {
  Query: {
    log: async (_, {id}, ctx) => {
      const { data, ref, ts } = await client.query(Get(Ref(Class("Logs"), id)))

      return ({ ...data, id: ref.id })
    },
    logs: async () => {
      let find = Map(
        Paginate(
          Match(Index("all_logs")),
          {size: 1000}
        ),
        Lambda("X", Get(Var("X")))
      )

      const { data }  = await client.query(find)
      return data.map(d => ({...d.data, id: d.ref.id}))
    },
  },
  Mutation: {
    addLog:  async (_, { title, rating }) => {

      const log = Create( Class("Logs"), { data: { title, rating } })
      const { data, ref, ts } = await client.query(log)

      return({...data, id: ref.id})
    },

    editLog: async (_, { id, title }) => {
      let updateQuery = Update(
        Ref(Class("Logs"), id),
        { data: { title } })

      const { data, ref, ts } = await client.query(updateQuery)
      console.log({data, ref, ts})

      return ({ ...data, id: ref.id })
    },
    deleteLog: async (_, { id }) => {
      let deleteQuery = Delete(Ref(Class("Logs"), id))

      const { data, ref, ts } = await client.query(deleteQuery)
      console.log({data, ref, ts})

      return ({ ...data, id: ref.id })
    }
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true,
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
