const loginSection = document.getElementById("loginSection");
const publicSection = document.getElementById("publicSection");
const userSection = document.getElementById("userSection");

/* Global */

// API Call
const retrieveBooksAPI = async () =>{
    try{
        const response = await axios.get("http://localhost:1337/api/books?populate=deep");
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

    generateBookDOM(){
        //Book
        const bookDiv = document.createElement("div");
        bookDiv.className = "book";
    
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

        return bookDiv;
    }
}

/* Login Section */

//Login
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

const getLoginInput = () =>{
    const username = document.getElementById("login_username").value;
    const password = document.getElementById("login_password").value;
    return {username, password};
}

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

    } catch (error) {
        console.error("Login failed:", error);
    }
}

//Register
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

const getRegisterInput = () =>{
    const username = document.getElementById("register_username").value;
    const email = document.getElementById("register_email").value;
    const password = document.getElementById("register_password").value;

    return {username, email, password};
}

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

//Books Display
const createPublicBooks = async () =>{
    const responseAPI = await retrieveBooksAPI();
    const dataAPI = responseAPI.data;

    const books = [];
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

const generateBookDisplayDOM = async () =>{
    const article = document.createElement("article");
    article.setAttribute("id", "booksDisplay");

    const books = await createPublicBooks();
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
    publicSection.appendChild(article);
}

//If no user is active, generate login and public DOM elements
if(!sessionStorage.getItem("activeUser")) {
    generateLoginDOM();
    generateBookDisplayDOM();
}

window.addEventListener('beforeunload', function() {
    sessionStorage.clear();
});
