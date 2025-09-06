import { Client, TablesDB, ID, Query } from "appwrite";

const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const DATABASE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;

const client = new Client()
  .setEndpoint(DATABASE_ENDPOINT)
  .setProject(PROJECT_ID);

export const tablesDB = new TablesDB(client);

export const updateSearchCount = async (searchTerm, movie) => {
  try {
    // find existing row for this search term (limit to 1)
    const list = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: "metrics",
      queries: [Query.equal("search_term", searchTerm), Query.limit(1)],
    });

    const rows = list.rows ?? list.documents ?? [];

    if (rows.length > 0) {
      const row = rows[0];

      // safest (and concurrency-friendly): use atomic increment
      await tablesDB.incrementRowColumn({
        databaseId: DATABASE_ID,
        tableId: "metrics",
        rowId: row.$id,
        column: "count",
        value: 1,
      });
    } else {
      await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: "metrics",
        rowId: ID.unique(),
        data: {
          search_term: searchTerm,
          count: 1,
          movie_id: movie.id,
          poster_url: `https://images.tmdb.org/t/p/w500/${movie.poster_path}`,
        },
      });
    }
  } catch (error) {
    console.error(error);
  }
};

export const getTrendingMovies = async () => {
  try {
    const list = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: "metrics",
      queries: [Query.limit(5), Query.orderDesc("count")],
    });
    const rows = list.rows ?? list.documents ?? [];

    return rows;
  } catch (error) {
    console.error(error);
  }
};
