type RelayPaginate = {
  pageInfo: {
    endCursor: string;
    hasNextPage: boolean;
  };
  edges: {
    node: any;
  }[];
};

type RelayPaginateProps = {
  finalArray: any[];
  cursorIdentifier: string;
  limit: number;
};

export const Cursorify = (info: any) =>
  Buffer.from(info.toString()).toString("base64");

export const Decursorify = (string: string) =>
  Buffer.from(string, "base64").toString();

/* 
  This is the function that automatically formats the data to be relayPaginated.  
  Here, you pass in the FINAL array in which is to be paginated, the after and the 
  limit args passed by the query. There are also other options such as sortedByDate
  and useCursorAlways. These two options help to decide if the function must use the
  actual "after" argument or the nearest to "after".
*/

const relayPaginate = ({
  finalArray,
  cursorIdentifier,
  limit,
}: RelayPaginateProps): RelayPaginate => {
  return {
    pageInfo: {
      endCursor:
        finalArray.length > 0
          ? Cursorify(finalArray[finalArray.length - 1][cursorIdentifier])
          : null,
      hasNextPage: finalArray.length < limit ? false : true,
    },
    edges: finalArray.map((a) => ({ node: a })),
  };
};

export default relayPaginate;
