function paginateQuery(db) {
      // [START cursor_paginate]
      let first = db.collection('cities')
        .orderBy('population')
        .limit(3);
    
      let paginate = first.get()
        .then((snapshot) => {
          // ...
    
          // Get the last document
          let last = snapshot.docs[snapshot.docs.length - 1];
    
          // Construct a new query starting at this document.
          // Note: this will not have the desired effect if multiple
          // cities have the exact same population value.
          let next = db.collection('cities')
            .orderBy('population')
            .startAfter(last.data().population)
            .limit(3);
    
          // Use the query for pagination
          // [START_EXCLUDE]
          return next.get().then((snapshot) => {
            console.log('Num results:', snapshot.docs.length);
          });
          // [END_EXCLUDE]
        });
      // [END cursor_paginate]
    
      return paginate;
    }
  