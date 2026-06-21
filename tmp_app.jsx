import { useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

export default function App() {
    const [ data, setData ] = useState( [1,2,3,4,5,6,7,8,9,10] );
    const MAX_DATA = 30;
    const hasMore = data.length < MAX_DATA;

    function fetchData( limit=10 ){
        const start = data.length + 1;
        const end = (data.length + limit) >= MAX_DATA 
                    ? MAX_DATA 
                    : (data.length + limit);
        let newData = [ ...data ];
        
        for( var i = start ; i <= end ; i++ ) {
            newData = [ ...newData, i ];
        }
    
        // fake delay to simulate a time-consuming network request
        setTimeout( () => setData( newData ), 1500 );
    }

    return (
        <div id="scrollableDiv" style={{width: "500px", height: "100vh", overflowY: "scroll", display: "flex", flexDirection: "column-reverse", margin: "auto"}} className="bg-body-tertiary p-3">
            <InfiniteScroll
                dataLength={ data.length }
                next={fetchData}
                hasMore={hasMore}
                loader={<p className="text-center m-5">⏳&nbsp;Loading...</p>}
                endMessage={<p className="text-center m-5">That&apos;s all folks!🐰🥕</p>}
                style={{ display: "flex", flexDirection: "column-reverse", overflow: "visible" }}
                scrollableTarget="scrollableDiv"
                inverse={true}
                >
                {
                    data.map( d => (
                        <div className="card mb-4" key={d} style={{width: "18rem"}}>
                            <div className="card-header">Card#{d}</div>
                            <div className="card-body">Lorem ipsum dolor sit amet</div>
                        </div>
                    ))
                }
            </InfiniteScroll>
        </div>
    )
}