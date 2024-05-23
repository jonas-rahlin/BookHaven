 /* Global */

//Variables for storing JWT and UserID
let userKey = null;
let userID = null;

//Variables for targeting main sections
const loginSection = document.getElementById("loginSection");
const publicSection = document.getElementById("publicSection");
const userSection = document.getElementById("userSection");

//API Call Books
const retrieveBooksAPI = async () =>{
    try{
        const response = await axios.get("http://localhost:1337/api/books?populate=deep,2");
        return response.data;
    } catch (error) {
        console.error("Error retrieving API information");
        throw error;
    }
}

// Array for storing Books
let books = [];

//Book Class
class Book {
    //Constructor
    constructor(title, author, pages, releaseDate, cover, rating, id){
        this.title = title;
        this.author = author;
        this.pages = pages;
        this.releaseDate = releaseDate;
        this.cover = cover;
        this.rating = rating;
        this.id = id;
    }

    //Rate Book Functionality
    async rateBook(bookID, rating, userID){
        try{
            //Check if user has rated book previously
            const userResponse = await axios.get(`http://localhost:1337/api/users/${userID}`);
            const ratedBooks = userResponse.data.ratedBooks;
            const alreadyRated = ratedBooks.find(review => review[0] === bookID);

            //Rating Average Calculator
            const myRating = parseInt(rating);
            const bookResponse = await axios.get(`http://localhost:1337/api/books/${bookID}`);
            const currentRating = bookResponse.data.data.attributes.rating;
            const timesRated = bookResponse.data.data.attributes.timesRated;
            const updatedRating = ((currentRating * timesRated) + myRating) / (timesRated + 1);

            //If rated remove old Review
            if(alreadyRated) {
                const oldRating = alreadyRated[1];
                const updatedRatingNegative = ((currentRating * timesRated) - oldRating) / (timesRated - 1);
                await axios.put(`http://localhost:1337/api/books/${bookID}`,
                {
                    data:{
                        rating: updatedRatingNegative,
                        timesRated: -1
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${userKey}`
                    }
                });      
            }

            //Add new Rating
            await axios.put(`http://localhost:1337/api/books/${bookID}`,
            {
                data:{
                    rating: updatedRating,
                    timesRated: timesRated+1
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${userKey}`
                }
            });
        } catch{
            console.log("Error Rating Book");
            throw error;
        }
    }

    //Updated Users Reviewed Books
    async updateRatedBooks(bookID, rating){
        const userAPI = await retrieveUserAPI();
        const ratedBooks = userAPI.ratedBooks;
        let found = false;
        console.log(ratedBooks);
    
        for (const review of ratedBooks) {
            if(review[0] === bookID) {
                review[1] = rating;
                found = true;
                break;
            }
        }
    
        if(!found){
            ratedBooks.push([bookID, rating]);
        }
    
        await axios.put(`http://localhost:1337/api/users/1`,
        {
            ratedBooks: ratedBooks
        },
        {
            headers: {
                Authorization: `Bearer ${userKey}`
            }
        });
    }

    //Remove Book Functioality
    async removeBook(bookID){
    await axios.put(`http://localhost:1337/api/users/${userID}`,
    {
            books:{
                disconnect:[bookID]
            }
    },
    {
        headers: {
            Authorization: `Bearer ${userKey}`
        }
    }
    );
    }

    //Add Book Functionality
    async addBook(bookID){
        await axios.put(`http://localhost:1337/api/users/${userID}`,
        {
                books:{
                    connect:[bookID]
                }
        },
        {
            headers: {
                Authorization: `Bearer ${userKey}`
            }
        }
        );
    }

    //Book DOM
    generateBookDOM(){
        //Book
        const bookDiv = document.createElement("div");
        bookDiv.className = "book";
        bookDiv.setAttribute("data", this.id);
    
        //Cover
        const img = document.createElement("img");
        img.className = "book_img";
        img.src = "http://localhost:1337" + this.cover;
        img.alt = "#";
        bookDiv.appendChild(img);
    
        //Title
        const title = document.createElement("h3");
        title.className = "book_title";
        title.textContent = this.title;
        bookDiv.appendChild(title);
    
        //Author
        const author = document.createElement("p");
        author.className = "book_author";
        author.textContent = this.author;
        bookDiv.appendChild(author);
    
        //Release
        const release = document.createElement("p");
        release.className = "book_release";
        release.textContent = this.releaseDate;
        bookDiv.appendChild(release);
    
        //Pages
        const pages = document.createElement("p");
        pages.className = "book_pages";
        pages.textContent = this.pages + " pages";
        bookDiv.appendChild(pages);

        //Rating
        const ratingDiv = document.createElement("div");
        ratingDiv.className = "book_rating";
        bookDiv.appendChild(ratingDiv);
        
        //Logged In User Only        
        if(!!sessionStorage.getItem("activeUser")){
            //My Books Only
            if(document.getElementById("selectDisplay").value === "user"){
                //Remove Book Event Listener
                bookDiv.addEventListener("click", async (event)=>{
                    const deleteConfirm = confirm("Do you want to delete this book?");
                    if(deleteConfirm){
                        const bookID = event.currentTarget.getAttribute("data");
                        await this.removeBook(bookID);
                        generateBookDisplayDOM();
                    }
                })
                
                //My Rating Selection
                const containerDiv = document.createElement("div");
                containerDiv.classList.add("container");
                containerDiv.addEventListener("click", (event)=>{
                    event.stopPropagation();
                })

                const p = document.createElement("p");
                p.textContent = "My Rating:";
                containerDiv.appendChild(p);
                
                const rateBook = document.createElement("select");

                rateBook.setAttribute("data", this.id);
                rateBook.classList.add("selectRating");
                rateBook.addEventListener("change", async (event)=>{
                    const myRating = rateBook.value;
                    await this.rateBook(this.id, myRating, userID);
                    await this.updateRatedBooks(this.id, parseInt(myRating));

                    //Temporary Bugg Solution
                    await retrieveUserAPI().then((user)=>{
                        myBookRatings = user.ratedBooks;
                    });

                    generateBookDisplayDOM();
                })
                
                const optionMinus = document.createElement("option");
                optionMinus.text = "-";
                optionMinus.value = "0";
                rateBook.appendChild(optionMinus);
                
                for (let i = 1; i <= 5; i++) {
                    const option = document.createElement("option");
                    option.text = i;
                    option.value = i;
                    rateBook.appendChild(option);
                }

                //Set My Rating Selectindex to User Book Review Score
                const setSelectIndexValues = async () =>{
                    const ratedBooks = await retrieveUserRatings();
                    const idToMatch = this.id;
                    let selectedIndex = -1;
                    for (let i = 0; i < ratedBooks.length; i++) {
                        if (ratedBooks[i][0] === idToMatch) {
                            selectedIndex = ratedBooks[i][1];
                            break;
                        }
                    }
                    if(selectedIndex === -1){
                        selectedIndex = 0;
                    }
    
                    rateBook.selectedIndex = selectedIndex;
                    
                    containerDiv.appendChild(rateBook);
                    bookDiv.appendChild(containerDiv); 
                }
                setSelectIndexValues();
                
            } else{
                bookDiv.addEventListener("click", async (event)=>{
                    const addConfirm = confirm("Do you want to add this book to your library?");
                    if(addConfirm){
                        const bookID = event.currentTarget.getAttribute("data");
                        await this.addBook(bookID);
                    }
                })
            }
        }   

        return bookDiv;
    }
}

//Books Display DOM Generation
const generateBookDisplayDOM = async () =>{
    try{
        const booksDisplay = document.getElementById("booksDisplay");
        
        //Remove Old Books Display
        if(booksDisplay){
            booksDisplay.remove();
        }

        //Create Books Display
        const article = document.createElement("article");
        article.setAttribute("id", "booksDisplay");

        //Create Books based on User Type
        let books = null;
        const selectDisplay = document.getElementById("selectDisplay");
        if(selectDisplay && selectDisplay.value === "user") {
            books = await createUserBooks();
        } else {
            books = await createPublicBooks();
        }

        //Sort Books
        sortBooks();

        //Create Book DOM elements
        for(let i=0; i<books.length; i++) {
            const bookDOM = books[i].generateBookDOM();

            const rating = Math.round(books[i].rating);

            if(rating > 0){
                for(let i=0; i<rating; i++){
                    const star = document.createElement("i");
                    star.classList.add('fa-solid', 'fa-star');
                    bookDOM.childNodes[5].appendChild(star);
                }
            }

            for(let i=0; i<(5-rating); i++){
                const star = document.createElement("i");
                star.classList.add('fa-regular', 'fa-star');
                bookDOM.childNodes[5].appendChild(star);
            }

            article.appendChild(bookDOM);
        }

        //Append Books to Section based on User
        if(!sessionStorage.getItem("activeUser")){
            publicSection.appendChild(article);
        } else {
            userSection.appendChild(article);
            loginSection.style.height = 0;
            loginSection.style.padding = 0;
        }

        //Update User Data Variables (should proably be moved elsewhere)
        if(JSON.parse(sessionStorage.getItem("activeUser")) !== null){
            userKey = JSON.parse(sessionStorage.getItem("activeUser")).jwt;
            userID = JSON.parse(sessionStorage.getItem("activeUser")).id;
        }
    } catch (error) {
        console.log("Error Generating Books Display DOM", error);
        throw error;
    }
}

//Set Theme
const setTheme = async () =>{
    try{
        //Fetch Themes from API
        const response = await axios.get(`http://localhost:1337/api/themes`);
        const themes = response.data.data;
        let activeTheme = null;

        //Search and set Active Theme
        for (const theme of themes) {
            if(theme.attributes.active === true){
                activeTheme = theme.attributes.css;
            } else {
                activeTheme = themes[1].attributes.css;
            }
            document.querySelector("style").textContent = activeTheme;
        }
    } catch (error) {
        console.log("Error applying color theme", error);
        throw error;
    }
}


/* Login Section */

//Login DOM Generation
const generateLoginDOM = () => {
    //Headings Container
    const headings = document.createElement("div");
    headings.setAttribute("id", "headings");

    //Heading 1
    const h1 = document.createElement("h1");
    h1.textContent = "BookHaven";
    headings.appendChild(h1);

    //Heading 2
    const h2 = document.createElement("h2");
    h2.textContent = "Where every page feels like home.";
    headings.appendChild(h2);

    //Login Article
    const article = document.createElement("article");
    article.setAttribute("id", "login");

    //Username
    const usernameInput = document.createElement("input");
    usernameInput.setAttribute("type", "text");
    usernameInput.setAttribute("id", "login_username");
    usernameInput.setAttribute("placeholder", "Username");
    article.appendChild(usernameInput);

    //Password
    const passwordInput = document.createElement("input");
    passwordInput.setAttribute("type", "password");
    passwordInput.setAttribute("id", "login_password");
    passwordInput.setAttribute("placeholder", "Password");
    article.appendChild(passwordInput);

    //Login Btn
    const loginBtn = document.createElement("button");
    loginBtn.setAttribute("type", "button");
    loginBtn.setAttribute("id", "login_btn");
    loginBtn.textContent = "Log In";
    loginBtn.addEventListener("click", ()=> {
        login();
    });
    article.appendChild(loginBtn);

    //Register Btn
    const registerBtn = document.createElement("button");
    registerBtn.setAttribute("type", "button");
    registerBtn.setAttribute("id", "register_btn");
    registerBtn.textContent = "Create Account";
    registerBtn.addEventListener("click", ()=> {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        generateRegisterDOM();
        document.body.classList.add("scrollLock");
    });
    article.appendChild(registerBtn);

    //Append remaining Elements
    loginSection.appendChild(headings);
    loginSection.appendChild(article);
}

//Login Functionality
const login = async () => {
    const username = document.getElementById("login_username").value;
    const password = document.getElementById("login_password").value;

    try {
        //Send login request
        let response = await axios.post(
            "http://localhost:1337/api/auth/local/",
            {
                identifier: username,
                password: password,
            }
        );

        //Retrieve user Data
        const userData = {
            id:response.data.user.id,
            username:response.data.user.username,
            jwt:response.data.jwt,
        };

        //Save user data
        sessionStorage.setItem("activeUser", JSON.stringify(userData));

        //Remove Login Section and Public Section
        publicSection.removeChild(publicSection.firstChild);
        while (loginSection.firstChild) {
            loginSection.removeChild(loginSection.firstChild);
        }

        //Generate user section DOM
        generateNavDOM();
        generateBookDisplayDOM();

        //Save User Data to Session Storage
        sessionStorage.setItem("activeUser", JSON.stringify(userData));

    } catch (error) {
        console.error("Login failed:", error);
        throw error;
    }
}


//Register DOM
const generateRegisterDOM = () => {
    //Scroll Lock Wrapper
    const wrapper = document.createElement("div");
    wrapper.setAttribute("class", "wrapper");
    wrapper.addEventListener("click", ()=>{
        document.body.classList.remove("scrollLock");
        wrapper.remove();
    })

    //Register Article
    const article = document.createElement("article");
    article.setAttribute("id", "register");
    article.addEventListener("click", ()=>{
        event.stopPropagation();
    })

    //Username
    const regUsernameInput = document.createElement("input");
    regUsernameInput.setAttribute("type", "text");
    regUsernameInput.setAttribute("id", "register_username");
    regUsernameInput.setAttribute("placeholder", "Username");

    //Email
    const regEmailInput = document.createElement("input");
    regEmailInput.setAttribute("type", "email");
    regEmailInput.setAttribute("id", "register_email");
    regEmailInput.setAttribute("placeholder", "Email");

    //Password
    const regPasswordInput = document.createElement("input");
    regPasswordInput.setAttribute("type", "password");
    regPasswordInput.setAttribute("id", "register_password");
    regPasswordInput.setAttribute("placeholder", "Password");

    //Login Btn
    const submitUserBtn = document.createElement("button");
    submitUserBtn.setAttribute("type", "button");
    submitUserBtn.setAttribute("id", "submitUser_btn");
    submitUserBtn.textContent = "Join";
    submitUserBtn.addEventListener("click", ()=> {
        register();
    });

    //Append Elements
    article.appendChild(regUsernameInput);
    article.appendChild(regPasswordInput);
    article.appendChild(regEmailInput);
    article.appendChild(submitUserBtn);

    wrapper.appendChild(article);
    loginSection.appendChild(wrapper);
}

//Register Functionality
const register = async () => {
    const username = document.getElementById("register_username").value;
    const email = document.getElementById("register_email").value;
    const password = document.getElementById("register_password").value;

    try {
        //Send New User Data
        await axios.post(
            "http://localhost:1337/api/auth/local/register",
            {
                username: username,
                email: email,
                password: password
            }
        );

        //Remove Register Modal and Scroll Lock
        document.getElementById("loginSection").querySelector(".wrapper").remove();
        document.body.classList.remove("scrollLock");

    } catch (error) {
        console.error("Registration failed:", error);
    }
}


/* Public Section */

//Public Books Creation
const createPublicBooks = async () =>{
    try{
        //Fetch Book API Data
        const responseAPI = await retrieveBooksAPI();
        const dataAPI = responseAPI.data;

        //Clear Books Array
        books = [];

        //Create Books and add to Books
        dataAPI.forEach((book)=>{
            const title = book.attributes.title;
            const author = book.attributes.author;
            const pages = book.attributes.pages;
            const releaseDate = book.attributes.releaseDate;
            const cover = book.attributes.cover.data.attributes.url;
            const rating = book.attributes.rating;
            const id = book.id;

            books.push(new Book(title, author, pages, releaseDate, cover, rating, id));
        })

        return books;

    } catch (error) {
        console.log("Error Creating Books", error);
        throw error;
    }
}


/* User Section */

//Sorting Tools DOM Generations
const generateSortingDOM = () => {
    //Sorting Article
    const article = document.createElement("article");
    article.id = "sorting";

    //Select Display Type
    const selectDisplay = document.createElement("select");
    selectDisplay.name = "";
    selectDisplay.id = "selectDisplay";
    selectDisplay.addEventListener("change", ()=>{
        //Generate Book Display DOM Elements
        generateBookDisplayDOM();

        //If displaying Users Book List, show option for sorting by User Book Rating
        if(selectDisplay.value === "user"){
            optionMyRatings.classList.remove("displayNone");

            //Temporary Bugg Solution - Async Issues
            retrieveUserAPI().then((user)=>{
                myBookRatings = user.ratedBooks;
            });

        } else{
            optionMyRatings.classList.add("displayNone");
        }
    });

    //Public Books Option
    const optionPublic = document.createElement("option");
    optionPublic.value = "public";
    optionPublic.id = "selectDisplay_public";
    optionPublic.textContent = "All Books";

    //User Books Option
    const optionUser = document.createElement("option");
    optionUser.value = "user";
    optionUser.id = "selectDisplay_user";
    optionUser.textContent = "My Books";

    //Append remaning Elements
    selectDisplay.appendChild(optionPublic);
    selectDisplay.appendChild(optionUser);

    article.appendChild(selectDisplay);

    //Select Sorting
    const sortBooks = document.createElement("select");
    sortBooks.name = "";
    sortBooks.id = "sortBooks";
    sortBooks.addEventListener("change", ()=>{
        generateBookDisplayDOM();
    })

    //Sort Option Title
    const optionTitle = document.createElement("option");
    optionTitle.value = "title";
    optionTitle.id = "sortBooks_title";
    optionTitle.textContent = "Title";

    //Sort Option Author
    const optionAuthor = document.createElement("option");
    optionAuthor.value = "author";
    optionAuthor.id = "sortBooks_author";
    optionAuthor.textContent = "Author";

    //Sort Option Rating
    const optionRating = document.createElement("option");
    optionRating.value = "rating";
    optionRating.id = "sortBooks_rating";
    optionRating.textContent = "Rating";

    //Sort Option Year
    const optionYear = document.createElement("option");
    optionYear.value = "year";
    optionYear.id = "sortBooks_year";
    optionYear.textContent = "Year";

    //Sort Option User Book Ratings
    const optionMyRatings = document.createElement("option");
    optionMyRatings.value = "myRatings";
    optionMyRatings.id = "sortBooks_myRatings";
    optionMyRatings.textContent = "My Ratings";
    optionMyRatings.classList.add("displayNone");

    //Append remaning Elements
    sortBooks.appendChild(optionTitle);
    sortBooks.appendChild(optionAuthor);
    sortBooks.appendChild(optionRating);
    sortBooks.appendChild(optionYear);
    sortBooks.appendChild(optionMyRatings);

    article.appendChild(sortBooks);

    document.getElementById("navbar").children[1].appendChild(article); 
}

//Navbar DOM Generation
const generateNavDOM = () => {
    //Navbar Article
    const article = document.createElement("article");
    article.id = "navbar";

    //Container 1
    const container1 = document.createElement("div");
    container1.className = "container";

    //Logo
    const navbarLogo = document.createElement("span");
    navbarLogo.id = "navbar_logo";
    navbarLogo.textContent = "BookHaven";

    //Logout
    const navbarLogout = document.createElement("button");
    navbarLogout.id = "navbar_logout";
    navbarLogout.type = "button";
    navbarLogout.textContent = "Log Out";

    //Logout when Clicked
    navbarLogout.addEventListener("click", ()=>{
        logout();
    });

    //Append to container 1
    container1.appendChild(navbarLogo);
    container1.appendChild(navbarLogout);

    //Container 2
    const container2 = document.createElement("div");
    container2.className = "container";

    //User
    const navbarUser = document.createElement("span");
    navbarUser.id = "navbar_user";
    navbarUser.textContent = JSON.parse(sessionStorage.getItem("activeUser")).username;

    //Append to container 2
    container2.appendChild(navbarUser);

    //Append
    article.appendChild(container1);
    article.appendChild(container2);
    document.querySelector("nav").appendChild(article);

    //Create Sorting DOM
    generateSortingDOM();
}

//Temporary Bug Solution -> "line 708" + "line 217"
let myBookRatings = null;

//Book Sorting Functionality
sortBooks = () =>{
    //Sort by Title as Default
    let sortBy = null;
    if(userKey === null){
        sortBy = "title";
    } else{
        sortBy = document.getElementById("sortBooks").value;
    }

    //Sorting Functions
    //Sort by Author Function
    const sortByTitleAuthor = () =>{
        books.sort((a, b)=>{
            let bookA = a[sortBy].toLowerCase();
            let bookB = b[sortBy].toLowerCase();
    
            //Remove "The"
            if (bookA.startsWith("the ")) {
                bookA = bookA.slice(4);
            }
            if (bookB.startsWith("the ")) {
                bookB = bookB.slice(4); //
            }
    
            if (bookA < bookB) {
                return -1;
            }
            if (bookA > bookB) {
                return 1;
            }
            return 0;
        })
    }

    //Sort by Rating Function
    const sortByRating = () =>{
        books.sort((a, b)=>{
            const bookA = a.rating;
            const bookB = b.rating;

            return bookB - bookA;
        })
    }

    //Sort by Year Function
    const sortByYear = () =>{
        books.sort((a, b)=>{
            const bookA = new Date(a.releaseDate);
            const bookB = new Date(b.releaseDate);

            return bookB - bookA;
        })
    }

    //Sort by MyRating Function - Chat GPT Generated
    const sortByMyRating =  () =>{
        const ratedBooks = myBookRatings;

        books.sort((a, b) => {
            let ratingA = ratedBooks.find(book => book[0] === a.id);
            let ratingB = ratedBooks.find(book => book[0] === b.id);
        
            // Handle cases where ratings are not found (0 rating)
            if (!ratingA && !ratingB) return 0;
            if (!ratingA) return 1;
            if (!ratingB) return -1;
        
            // Sorting based on rating value
            return ratingB[1] - ratingA[1];
        });
    }
    
    //Sorting Conditions
    //Sort by Title or Author
    if(sortBy === "title" || sortBy === "author"){
        sortByTitleAuthor();
    }

    //Sort by Rating
    if (sortBy === "rating") {
        //Sort by Title first to ensure order on equal rating
        const method = sortBy;
        sortBy = "title";
        sortByTitleAuthor();

        //Sort by Rating
        sortBy = method;
        sortByRating();
    }

    //Sort by Release Date
    if (sortBy === "year") {
        //Sort by Title first to ensure order on equal rating
        const method = sortBy;
        sortBy = "title";
        sortByTitleAuthor();

        //Sort by Year
        sortBy = method;
        sortByYear();
    }

    if (sortBy === "myRatings"){
        //Sort by Title first to ensure order on equal rating
        const method = sortBy;
        sortBy = "title";
        sortByTitleAuthor();

        //Sort by MyRatings
        sortBy = method;

        sortByMyRating();
    }
}


//API Call User
const retrieveUserAPI = async () =>{
    try{
        const response = await axios.get(`http://localhost:1337/api/users/${userID}?populate=deep,3`);
        return response.data;
    } catch (error) {
        console.error("Error retrieving API information");
        throw error;
    }
}

//API Call User Ratings
const retrieveUserRatings = async () =>{
    try{
        const user = await retrieveUserAPI();
        const ratedBooks = user.ratedBooks;
    
        return ratedBooks;
    } catch (error){
        console.log("Error retrieving user API Rated Books");
        throw error;
    }
}

//User Books Creation
const createUserBooks = async () => {
    try{
        //Retrive API Book Data
        const responseAPI = await retrieveUserAPI();
        const booksData = responseAPI.books;
    
        //Clear old Books
        books = [];

        //Create Books
        booksData.forEach((book)=>{
            const title = book.title;
            const author = book.author;
            const pages = book.pages;
            const releaseDate = book.releaseDate;
            const cover = book.cover.url;
            const rating = book.rating;
            const id = book.id;
    
            books.push(new Book(title, author, pages, releaseDate, cover, rating, id));
        })

        return books;
    } catch (error) {
        console.log("Error Creating Users Books");
        throw error;
    }
}

//Logout Functionality
const logout = () =>{
    //Clear Session Storage and refresh Browser
    sessionStorage.clear();
    location.reload();
}


/* Run on refresh */

//Check if there is an active user or not, then run appropriate DOM creations
if(sessionStorage.getItem("activeUser")) {
    generateNavDOM();
    generateBookDisplayDOM();
} else {
    generateLoginDOM();
    generateBookDisplayDOM();
}

//Set Theme
setTheme();

