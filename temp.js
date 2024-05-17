const addToMyBooks = async (id) =>{
    const selectedBookDisplay = document.getElementById("selectDisplay").value;
    const isLoggedIn = !!sessionStorage.getItem("activeUser");

    if(isLoggedIn && selectedBookDisplay === "public") {
        const bookID = 5;
        const userID = JSON.parse(sessionStorage.getItem("activeUser")).id;
        const userKey = JSON.parse(sessionStorage.getItem("activeUser")).jwt;

        const bookResponse = await axios.get(`http://localhost:1337/api/books/${bookID}?populate=deep`);
        const bookToAdd = bookResponse.data.data;
        console.log(bookToAdd);

        const res = await axios.get(`http://localhost:1337/api/users/me?populate=deep,3`,

        {
            headers: {
                Authorization: `Bearer ${userKey}`
            }
        });
        console.log(res.data);


    }   else{
        console.log("go fuck yourself");
    }
}