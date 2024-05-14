const loginSection = document.getElementById("loginSection");
const publicSection = document.getElementById("publicSection");
const userSection = document.getElementById("userSection");


//Login Section
const getLoginInput = () =>{
    const username = document.getElementById("login_username").value;
    const password = document.getElementById("login_password").value;
    return {username, password};
}

const generateLoginDOM = () => {
    //Login Article
    const article = document.createElement("article");
    article.setAttribute("id", "login");

    //Username
    const usernameInput = document.createElement("input");
    usernameInput.setAttribute("type", "text");
    usernameInput.setAttribute("id", "login_username");
    usernameInput.setAttribute("placeholder", "Username");

    //Password
    const passwordInput = document.createElement("input");
    passwordInput.setAttribute("type", "password");
    passwordInput.setAttribute("id", "login_password");
    passwordInput.setAttribute("placeholder", "Password");

    //Login Btn
    const loginBtn = document.createElement("button");
    loginBtn.setAttribute("type", "button");
    loginBtn.setAttribute("id", "login_btn");
    loginBtn.textContent = "Log In";
    loginBtn.addEventListener("click", ()=> {
        console.log("working...");
        login();
    });

    //Append Elements
    article.appendChild(usernameInput);
    article.appendChild(passwordInput);
    article.appendChild(loginBtn);

    loginSection.appendChild(article);
}

const login = async () => {
    try {
        let response = await axios.post(
            "http://localhost:1337/api/auth/local/",
            {
                identifier: getLoginInput().username,
                password: getLoginInput().password,
            }
        );

        const userData = {
            id:response.data.user.id,
            username:response.data.user.username,
            jwt:response.data.jwt,
        };

        sessionStorage.setItem("activeUser", JSON.stringify(userData));
        console.log(response.data);
    } catch (error) {
        console.error("Login failed:", error);
    }
}

const activeUser = () =>{
    
    return {id, username, jwt};
}

const loginBtn = document.getElementById("");





//Public Section

//User Section


//Retrive the Information from Login Inputs




generateLoginDOM();



/* const register = async () => {
    try {
        let response = await axios.post(
            "http://localhost:1337/api/auth/local/register",
            {
                username: registerUserName.value,
                email: registerUserEmail.value,
                password: registerUserPassword.value,
            }
        );
    } catch (error) {
        console.error("Registration failed:", error);
    }
} */