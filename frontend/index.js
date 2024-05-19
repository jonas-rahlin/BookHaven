const loginSection = document.getElementById("loginSection");
const publicSection = document.getElementById("publicSection");
const userSection = document.getElementById("userSection");
        
/* Global */
let userKey = null;
let userID = null;

// API Call Books
const retrieveBooksAPI = async () =>{
    try{
        const response = await axios.get("http://localhost:1337/api/books?populate=deep,2");
        return response.data;
    } catch (error) {
        console.error("Error retrieving API information");
    }
}

// Book Class
class Book {
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
                
                containerDiv.appendChild(rateBook);
                bookDiv.appendChild(containerDiv);
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

// Array for storing Books
let books = [];

//Books Display DOM
const generateBookDisplayDOM = async () =>{
    const booksDisplay = document.getElementById("booksDisplay");
    if(booksDisplay){
        booksDisplay.remove();
    }

    const article = document.createElement("article");
    article.setAttribute("id", "booksDisplay");

    let books = null;
    const selectDisplay = document.getElementById("selectDisplay");
    if(selectDisplay && selectDisplay.value === "user") {
        books = await createUserBooks();
    } else {
        books = await createPublicBooks();
    }

    sortBooks();

    console.log(books);
    for(const book of books) {
        const bookDOM = book.generateBookDOM();

        const rating = Math.round(book.rating);

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

    if(!sessionStorage.getItem("activeUser")){
        publicSection.appendChild(article);
    } else {
        userSection.appendChild(article);
        loginSection.style.height = 0;
        loginSection.style.padding = 0;
    }

    if(JSON.parse(sessionStorage.getItem("activeUser")) !== null){
        userKey = JSON.parse(sessionStorage.getItem("activeUser")).jwt;
        userID = JSON.parse(sessionStorage.getItem("activeUser")).id;
    }
}

/* Login Section */

//Login DOM
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
        console.log("working...");
        login();
    });
    article.appendChild(loginBtn);

    const registerBtn = document.createElement("button");
    registerBtn.setAttribute("type", "button");
    registerBtn.setAttribute("id", "register_btn");
    registerBtn.textContent = "Create Account";
    registerBtn.addEventListener("click", ()=> {
        generateRegisterDOM();
    });
    article.appendChild(registerBtn);

    //Append Elements
    loginSection.appendChild(headings);
    loginSection.appendChild(article);
}
//Login Input Values
const getLoginInput = () =>{
    const username = document.getElementById("login_username").value;
    const password = document.getElementById("login_password").value;
    return {username, password};
}
//Login Functionality
const login = async () => {
    try {
        //Send login request
        let response = await axios.post(
            "http://localhost:1337/api/auth/local/",
            {
                identifier: getLoginInput().username,
                password: getLoginInput().password,
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

        //Generate user section
        generateNavDOM();
        generateBookDisplayDOM();

        //Save User Data
        sessionStorage.setItem("activeUser", JSON.stringify(userData));

    } catch (error) {
        console.error("Login failed:", error);
    }
}

//Register DOM
const generateRegisterDOM = () => {
    const wrapper = document.createElement("div");
    wrapper.setAttribute("class", "wrapper");
    wrapper.addEventListener("click", ()=>{
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
//Register Input Values
const getRegisterInput = () =>{
    const username = document.getElementById("register_username").value;
    const email = document.getElementById("register_email").value;
    const password = document.getElementById("register_password").value;

    return {username, email, password};
}
//Register Functionality
const register = async () => {
    try {
        //Send New User Data
        await axios.post(
            "http://localhost:1337/api/auth/local/register",
            {
                username: getRegisterInput().username,
                email: getRegisterInput().email,
                password: getRegisterInput().password
            }
        );

        //Remove Register Modal
        document.getElementById("loginSection").querySelector(".wrapper").remove();

    } catch (error) {
        console.error("Registration failed:", error);
    }
}


/* Public Section */

//Public Books Creation
const createPublicBooks = async () =>{
    const responseAPI = await retrieveBooksAPI();
    const dataAPI = responseAPI.data;

    books = [];
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
}


/* User Section */

//User Info Variables



//Navbar DOM
const generateNavDOM = () => {
    //Article
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
    const logoutIcon = document.createElement("i");
    logoutIcon.className = "fa-solid fa-door-open";
    navbarLogout.appendChild(logoutIcon);
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

//Book Sorting Functionality
sortBooks = () =>{
    let sortBy = null;
    if(userKey === null){
        sortBy = "title";
    } else{
        sortBy = document.getElementById("sortBooks").value;
    }

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

    const sortByRating = () =>{
        console.log(books);
        books.sort((a, b)=>{
            const bookA = a.rating;
            const bookB = b.rating;

            return bookB - bookA;
        })
    }

    const sortByYear = () =>{
        books.sort((a, b)=>{
            console.log(a.releaseYear);
            const bookA = new Date(a.releaseDate);
            const bookB = new Date(b.releaseDate);
            console.log(bookA);

            return bookB - bookA;
        })
    }
    
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
        console.log("sort by year");
        sortByYear();
    }
}

//Sorting Tools DOM
const generateSortingDOM = () => {
    //Article
    const article = document.createElement("article");
    article.id = "sorting";

    //Select Display Type
    const selectDisplay = document.createElement("select");
    selectDisplay.name = "";
    selectDisplay.id = "selectDisplay";
    selectDisplay.addEventListener("change", ()=>{
        generateBookDisplayDOM();

        if(selectDisplay.value === "user"){
            optionMyRatings.classList.remove("displayNone");
        } else{
            optionMyRatings.classList.add("displayNone");
        }
    });

    const optionPublic = document.createElement("option");
    optionPublic.value = "public";
    optionPublic.id = "selectDisplay_public";
    optionPublic.textContent = "All Books";

    const optionUser = document.createElement("option");
    optionUser.value = "user";
    optionUser.id = "selectDisplay_user";
    optionUser.textContent = "My Books";

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

    const optionTitle = document.createElement("option");
    optionTitle.value = "title";
    optionTitle.id = "sortBooks_title";
    optionTitle.textContent = "Title";

    const optionAuthor = document.createElement("option");
    optionAuthor.value = "author";
    optionAuthor.id = "sortBooks_author";
    optionAuthor.textContent = "Author";

    const optionRating = document.createElement("option");
    optionRating.value = "rating";
    optionRating.id = "sortBooks_rating";
    optionRating.textContent = "Rating";

    const optionYear = document.createElement("option");
    optionYear.value = "year";
    optionYear.id = "sortBooks_year";
    optionYear.textContent = "Year";

    const optionMyRatings = document.createElement("option");
    optionMyRatings.value = "myRatings";
    optionMyRatings.id = "sortBooks_myRatings";
    optionMyRatings.textContent = "My Ratings";
    optionMyRatings.classList.add("displayNone");

    sortBooks.appendChild(optionTitle);
    sortBooks.appendChild(optionAuthor);
    sortBooks.appendChild(optionRating);
    sortBooks.appendChild(optionYear);
    sortBooks.appendChild(optionMyRatings);

    article.appendChild(sortBooks);

    document.getElementById("navbar").children[1].appendChild(article); 
}

//API Call User
const retrieveUserAPI = async () =>{
    const userID = JSON.parse(sessionStorage.getItem("activeUser")).id;
    try{
        const response = await axios.get(`http://localhost:1337/api/users/${userID}?populate=deep,3`);
        return response.data;
    } catch (error) {
        console.error("Error retrieving API information");
    }
}

//User Books Creation
const createUserBooks = async () => {
    const responseAPI = await retrieveUserAPI();
    const dataAPI = responseAPI.books;

    books = [];
    dataAPI.forEach((book)=>{
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
}

//Logout Functionality
const logout = () =>{
    sessionStorage.clear();
    location.reload();
}




/* Run on start */

//Check if there is an active user or not, then run appropriate DOM creations
if(sessionStorage.getItem("activeUser")) {
    generateNavDOM();
    generateBookDisplayDOM();
} else {
    generateLoginDOM();
    generateBookDisplayDOM();
}

/* window.addEventListener('beforeunload', function() {
    sessionStorage.clear();
}); */

const up = async () => {
    await axios.put(`http://localhost:1337/api/users/1`,
    {
        ratedBooks: [4]
    },
    {
        headers: {
            Authorization: `Bearer ${userKey}`
        }
    });
}