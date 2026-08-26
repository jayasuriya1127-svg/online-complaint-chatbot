// =========================================================
// ONLINE COMPLAINT - COMPLETE FRONTEND CONTROLLER
// =========================================================

console.log("🚀 Online Complaint frontend loaded successfully");


// =========================================================
// FIREBASE IMPORTS
// =========================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


// =========================================================
// FIREBASE CONFIG
// =========================================================

const firebaseConfig = {

    apiKey: "AIzaSyDjwzO-p791IiMBAi4OqBT32KOTssL9ieg",

    authDomain:
        "online-complaint-chatbot.firebaseapp.com",

    projectId:
        "online-complaint-chatbot",

    storageBucket:
        "online-complaint-chatbot.firebasestorage.app",

    messagingSenderId:
        "398320535067",

    appId:
        "1:398320535067:web:334307ac2cdf39c72e9abe",

    measurementId:
        "G-PL864QPD8D"
};


// =========================================================
// INITIALIZE FIREBASE
// =========================================================

const firebaseApp =
    initializeApp(firebaseConfig);

const auth =
    getAuth(firebaseApp);

const db =
    getFirestore(firebaseApp);


// =========================================================
// HELPER - SAFE JSON RESPONSE
// =========================================================

async function getResponseJSON(response) {

    const text = await response.text();

    if (!text) {

        return {
            success: false,
            message: "Empty server response."
        };

    }

    try {

        return JSON.parse(text);

    } catch (error) {

        console.error(
            "Invalid JSON response:",
            text
        );

        return {
            success: false,
            message:
                "Server returned an invalid response."
        };

    }

}


// =========================================================
// REGISTER
// =========================================================

const registerForm =
    document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const nameElement =
                document.getElementById("registerName");

            const emailElement =
                document.getElementById("registerEmail");

            const passwordElement =
                document.getElementById("registerPassword");

            const message =
                document.getElementById("registerMessage");


            const name =
                nameElement
                    ? nameElement.value.trim()
                    : "";

            const email =
                emailElement
                    ? emailElement.value.trim()
                    : "";

            const password =
                passwordElement
                    ? passwordElement.value
                    : "";


            if (!name || !email || !password) {

                if (message) {

                    message.className =
                        "message-box error";

                    message.innerText =
                        "Please fill all fields.";

                }

                return;

            }


            if (password.length < 6) {

                if (message) {

                    message.className =
                        "message-box error";

                    message.innerText =
                        "Password must contain at least 6 characters.";

                }

                return;

            }


            try {

                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    userCredential.user;


                await updateProfile(
                    user,
                    {
                        displayName: name
                    }
                );


                await setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {

                        name: name,

                        email: email,

                        role: "student",

                        createdAt:
                            new Date().toISOString()

                    }
                );


                if (message) {

                    message.className =
                        "message-box success";

                    message.innerText =
                        "Account created successfully!";

                }


                setTimeout(
                    function() {

                        window.location.href =
                            "/dashboard";

                    },
                    1000
                );


            } catch (error) {

                console.error(
                    "❌ Registration error:",
                    error
                );


                if (message) {

                    message.className =
                        "message-box error";

                    message.innerText =
                        getFirebaseError(error);

                }

            }

        }
    );

}


// =========================================================
// LOGIN
// =========================================================

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const emailElement =
                document.getElementById("loginEmail");

            const passwordElement =
                document.getElementById("loginPassword");

            const message =
                document.getElementById("loginMessage");


            const email =
                emailElement
                    ? emailElement.value.trim()
                    : "";

            const password =
                passwordElement
                    ? passwordElement.value
                    : "";


            if (!email || !password) {

                if (message) {

                    message.className =
                        "message-box error";

                    message.innerText =
                        "Please enter email and password.";

                }

                return;

            }


            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


                if (message) {

                    message.className =
                        "message-box success";

                    message.innerText =
                        "Login successful!";

                }


                setTimeout(
                    function() {

                        window.location.href =
                            "/dashboard";

                    },
                    700
                );


            } catch (error) {

                console.error(
                    "❌ Login error:",
                    error
                );


                if (message) {

                    message.className =
                        "message-box error";

                    message.innerText =
                        getFirebaseError(error);

                }

            }

        }
    );

}


// =========================================================
// PASSWORD TOGGLE
// =========================================================

window.togglePassword =
    function() {

        const input =
            document.getElementById(
                "loginPassword"
            );


        if (!input) {

            return;

        }


        if (input.type === "password") {

            input.type = "text";

        } else {

            input.type = "password";

        }

    };


// =========================================================
// LOGOUT
// =========================================================

window.logout =
    async function() {

        try {

            await signOut(auth);

            window.location.href = "/";

        } catch (error) {

            console.error(
                "❌ Logout error:",
                error
            );

        }

    };


// =========================================================
// GEMINI AI COMPLAINT ANALYSIS
// =========================================================

window.analyzeComplaint =
    async function() {

        const descriptionElement =
            document.getElementById(
                "complaintDescription"
            );

        const result =
            document.getElementById(
                "aiResult"
            );


        if (!descriptionElement || !result) {

            console.error(
                "Complaint description or AI result element not found."
            );

            return;

        }


        const description =
            descriptionElement.value.trim();


        if (!description) {

            result.className =
                "ai-result show";

            result.innerHTML =
                "⚠️ Please enter complaint description.";

            return;

        }


        result.className =
            "ai-result show loading";

        result.innerHTML =
            "🤖 Gemini AI is analyzing your complaint...";


        try {

            const response =
                await fetch(
                    "/analyze-complaint",
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                complaint:
                                    description

                            })

                    }
                );


            const data =
                await getResponseJSON(response);


            console.log(
                "🤖 Gemini response:",
                data
            );


            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    data.error ||
                    "AI analysis failed."
                );

            }


            result.className =
                "ai-result show";

            result.innerHTML =
                formatAIResponse(
                    data.analysis
                );


        } catch (error) {

            console.error(
                "❌ Gemini error:",
                error
            );


            result.className =
                "ai-result show";

            result.innerHTML =
                "❌ " +
                escapeHTML(
                    error.message ||
                    "Unable to connect to AI."
                );

        }

    };


// =========================================================
// NEW COMPLAINT SUBMISSION
// =========================================================

const complaintForm =
    document.getElementById(
        "complaintForm"
    );


if (complaintForm) {

    console.log(
        "📝 Complaint form detected."
    );


    complaintForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            console.log(
                "📤 Complaint submit started..."
            );


            // -------------------------------------------------
            // PREVENT DUPLICATE SUBMISSION
            // -------------------------------------------------

            if (
                complaintForm.dataset.submitting ===
                "true"
            ) {

                console.log(
                    "⚠️ Already submitting..."
                );

                return;

            }


            // -------------------------------------------------
            // GET ELEMENTS
            // -------------------------------------------------

            const titleElement =
                document.getElementById(
                    "complaintTitle"
                );


            const categoryElement =
                document.getElementById(
                    "complaintCategory"
                );


            const descriptionElement =
                document.getElementById(
                    "complaintDescription"
                );


            const message =
                document.getElementById(
                    "complaintMessage"
                );


            // -------------------------------------------------
            // GET VALUES
            // -------------------------------------------------

            const title =
                titleElement
                    ? titleElement.value.trim()
                    : "";


            const category =
                categoryElement
                    ? categoryElement.value.trim()
                    : "";


            const description =
                descriptionElement
                    ? descriptionElement.value.trim()
                    : "";


            // -------------------------------------------------
            // CURRENT USER
            // -------------------------------------------------

            const user =
                auth.currentUser;


            console.log(
                "👤 Current Firebase user:",
                user
            );


            // -------------------------------------------------
            // LOGIN CHECK
            // -------------------------------------------------

            if (!user) {

                console.error(
                    "❌ User is not logged in."
                );


                if (message) {

                    message.className =
                        "message-box error";

                    message.innerText =
                        "Please login first.";

                }

                return;

            }


            // -------------------------------------------------
            // VALIDATION
            // -------------------------------------------------

            if (!title) {

                if (message) {

                    message.className =
                        "message-box error";

                    message.innerText =
                        "Please enter complaint title.";

                }

                if (titleElement) {

                    titleElement.focus();

                }

                return;

            }


            if (!category) {

                if (message) {

                    message.className =
                        "message-box error";

                    message.innerText =
                        "Please select a complaint category.";

                }

                if (categoryElement) {

                    categoryElement.focus();

                }

                return;

            }


            if (!description) {

                if (message) {

                    message.className =
                        "message-box error";

                    message.innerText =
                        "Please enter complaint description.";

                }

                if (descriptionElement) {

                    descriptionElement.focus();

                }

                return;

            }


            // -------------------------------------------------
            // LOCK FORM
            // -------------------------------------------------

            complaintForm.dataset.submitting =
                "true";


            const submitButton =
                complaintForm.querySelector(
                    'button[type="submit"]'
                );


            const originalButtonText =
                submitButton
                    ? submitButton.innerText
                    : "Submit Complaint";


            if (submitButton) {

                submitButton.disabled = true;

                submitButton.innerText =
                    "Submitting...";

            }


            if (message) {

                message.className =
                    "message-box";

                message.innerText =
                    "Submitting your complaint...";

            }


            // -------------------------------------------------
            // DATA
            // -------------------------------------------------

            const complaintData = {

                userId:
                    user.uid,

                name:
                    user.displayName ||
                    "Student",

                email:
                    user.email || "",

                title:
                    title,

                description:
                    description,

                category:
                    category

            };


            console.log(
                "📦 Sending complaint:",
                complaintData
            );


            // -------------------------------------------------
            // SEND TO FLASK
            // -------------------------------------------------

            try {

                const response =
                    await fetch(
                        "/submit-complaint",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    complaintData
                                )

                        }
                    );


                console.log(
                    "📡 Server status:",
                    response.status
                );


                const data =
                    await getResponseJSON(
                        response
                    );


                console.log(
                    "📥 Complaint server response:",
                    data
                );


                // -------------------------------------------------
                // SUCCESS
                // -------------------------------------------------

                if (
                    response.ok &&
                    data.success === true
                ) {

                    if (message) {

                        message.className =
                            "message-box success";

                        message.innerText =
                            "✅ Complaint submitted successfully! " +
                            "Complaint ID: " +
                            (
                                data.complaintId ||
                                "Generated"
                            );

                    }


                    console.log(
                        "✅ Complaint submitted:",
                        data.complaintId
                    );


                    // Reset form

                    complaintForm.reset();


                    // Unlock

                    complaintForm.dataset.submitting =
                        "false";


                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.innerText =
                            originalButtonText;

                    }


                    // Redirect dashboard

                    setTimeout(
                        function() {

                            window.location.href =
                                "/dashboard";

                        },
                        1200
                    );


                    return;

                }


                // -------------------------------------------------
                // SERVER ERROR
                // -------------------------------------------------

                throw new Error(

                    data.message ||

                    data.error ||

                    "Complaint submission failed."

                );


            } catch (error) {

                console.error(
                    "❌ Complaint submission error:",
                    error
                );


                if (message) {

                    message.className =
                        "message-box error";

                    message.innerText =
                        "❌ " +
                        (
                            error.message ||
                            "Unable to submit complaint."
                        );

                }


                // Unlock

                complaintForm.dataset.submitting =
                    "false";


                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.innerText =
                        originalButtonText;

                }

            }

        }
    );

}


// =========================================================
// LOAD DASHBOARD COMPLAINTS
// =========================================================

async function loadDashboardComplaints() {

    const complaintList =
        document.getElementById(
            "complaintList"
        );


    const loading =
        document.getElementById(
            "complaintLoading"
        );


    const empty =
        document.getElementById(
            "emptyComplaint"
        );


    const errorBox =
        document.getElementById(
            "complaintError"
        );


    const totalElement =
        document.getElementById(
            "totalComplaints"
        );


    const pendingElement =
        document.getElementById(
            "pendingComplaints"
        );


    const progressElement =
        document.getElementById(
            "progressComplaints"
        );


    const resolvedElement =
        document.getElementById(
            "resolvedComplaints"
        );


    // Not dashboard

    if (!complaintList) {

        return;

    }


    try {

        console.log(
            "📋 Loading complaints..."
        );


        if (loading) {

            loading.style.display =
                "block";

        }


        if (empty) {

            empty.style.display =
                "none";

        }


        if (errorBox) {

            errorBox.style.display =
                "none";

        }


        const response =
            await fetch(
                "/complaints",
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        console.log(
            "📡 Complaints API status:",
            response.status
        );


        const data =
            await getResponseJSON(
                response
            );


        console.log(
            "📦 Complaints API:",
            data
        );


        if (!response.ok || !data.success) {

            throw new Error(

                data.error ||

                data.message ||

                "Failed to fetch complaints."

            );

        }


        let complaints =
            Array.isArray(
                data.complaints
            )
                ? data.complaints
                : [];


        // -------------------------------------------------
        // CURRENT USER FILTER
        // -------------------------------------------------

        const currentUser =
            auth.currentUser;


        if (currentUser) {

            complaints =
                complaints.filter(
                    function(complaint) {

                        return (
                            String(
                                complaint.userId || ""
                            ) ===
                            String(
                                currentUser.uid
                            )
                        );

                    }
                );

        }


        console.log(
            "👤 Current user complaints:",
            complaints
        );


        // -------------------------------------------------
        // SORT
        // -------------------------------------------------

        complaints.sort(
            function(a, b) {

                return (
                    new Date(
                        b.createdAt || 0
                    ) -
                    new Date(
                        a.createdAt || 0
                    )
                );

            }
        );


        // -------------------------------------------------
        // STATISTICS
        // -------------------------------------------------

        const total =
            complaints.length;


        const pending =
            complaints.filter(
                function(complaint) {

                    return normalizeStatus(
                        complaint.status
                    ) === "pending";

                }
            ).length;


        const progress =
            complaints.filter(
                function(complaint) {

                    return normalizeStatus(
                        complaint.status
                    ) === "inprogress";

                }
            ).length;


        const resolved =
            complaints.filter(
                function(complaint) {

                    return normalizeStatus(
                        complaint.status
                    ) === "resolved";

                }
            ).length;


        if (totalElement) {

            totalElement.innerText =
                total;

        }


        if (pendingElement) {

            pendingElement.innerText =
                pending;

        }


        if (progressElement) {

            progressElement.innerText =
                progress;

        }


        if (resolvedElement) {

            resolvedElement.innerText =
                resolved;

        }


        // -------------------------------------------------
        // LOADING HIDE
        // -------------------------------------------------

        if (loading) {

            loading.style.display =
                "none";

        }


        // -------------------------------------------------
        // EMPTY
        // -------------------------------------------------

        if (complaints.length === 0) {

            complaintList.innerHTML = "";

            if (empty) {

                empty.style.display =
                    "block";

            }

            return;

        }


        if (empty) {

            empty.style.display =
                "none";

        }


        // -------------------------------------------------
        // DISPLAY COMPLAINTS
        // -------------------------------------------------

        complaintList.innerHTML =
            complaints
                .map(
                    function(complaint) {

                        const status =
                            complaint.status ||
                            "Pending";


                        const statusClass =
                            normalizeStatus(
                                status
                            );


                        let createdDate =
                            "Date unavailable";


                        if (
                            complaint.createdAt
                        ) {

                            try {

                                createdDate =
                                    new Date(
                                        complaint.createdAt
                                    ).toLocaleString();

                            } catch (error) {

                                createdDate =
                                    String(
                                        complaint.createdAt
                                    );

                            }

                        }


                        return `

                            <div class="complaint-item">

                                <div class="complaint-item-header">

                                    <div>

                                        <h3>
                                            ${escapeHTML(
                                                complaint.title ||
                                                "Untitled Complaint"
                                            )}
                                        </h3>

                                        <span class="complaint-id">
                                            ID:
                                            ${escapeHTML(
                                                complaint.complaintId ||
                                                "N/A"
                                            )}
                                        </span>

                                    </div>


                                    <span
                                        class="status ${escapeHTML(
                                            statusClass
                                        )}"
                                    >
                                        ${escapeHTML(
                                            status
                                        )}
                                    </span>

                                </div>


                                <p class="complaint-description">

                                    ${escapeHTML(
                                        complaint.description ||
                                        "No description"
                                    )}

                                </p>


                                <div class="complaint-meta">

                                    <span>
                                        📂
                                        ${escapeHTML(
                                            complaint.category ||
                                            "Other"
                                        )}
                                    </span>


                                    <span>
                                        📅
                                        ${escapeHTML(
                                            createdDate
                                        )}
                                    </span>

                                </div>

                            </div>

                        `;

                    }
                )
                .join("");


    } catch (error) {

        console.error(
            "❌ Dashboard error:",
            error
        );


        if (loading) {

            loading.style.display =
                "none";

        }


        if (errorBox) {

            errorBox.style.display =
                "block";

            const errorMessage =
                document.getElementById(
                    "complaintErrorMessage"
                );

            if (errorMessage) {

                errorMessage.innerText =
                    error.message ||
                    "Unable to load complaints.";

            }

        } else {

            complaintList.innerHTML = `

                <div class="empty-state">

                    <div>❌</div>

                    <h3>
                        Unable to load complaints
                    </h3>

                    <p>
                        ${escapeHTML(
                            error.message ||
                            "Please refresh the page."
                        )}
                    </p>

                </div>

            `;

        }

    }

}


// =========================================================
// MAKE LOAD COMPLAINTS AVAILABLE TO HTML
// =========================================================

window.loadComplaints =
    loadDashboardComplaints;


// =========================================================
// FIREBASE AUTH STATE
// =========================================================

onAuthStateChanged(
    auth,
    async function(user) {

        const userName =
            document.getElementById(
                "userName"
            );


        if (user) {

            console.log(
                "👤 Logged in:",
                user.email
            );


            if (userName) {

                userName.innerText =
                    user.displayName ||
                    user.email ||
                    "User";

            }


            await loadDashboardComplaints();

        } else {

            console.log(
                "👤 No user logged in."
            );

        }

    }
);


// =========================================================
// NORMALIZE STATUS
// =========================================================

function normalizeStatus(status) {

    return String(
        status || ""
    )
        .toLowerCase()
        .replace(
            /[\s_-]+/g,
            ""
        );

}


// =========================================================
// FORMAT GEMINI RESPONSE
// =========================================================

function formatAIResponse(text) {

    if (!text) {

        return "No AI response.";

    }


    return String(text)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /\n/g,
            "<br>"
        )

        .replace(
            /Category:/gi,
            "<strong>Category:</strong>"
        )

        .replace(
            /Priority:/gi,
            "<strong>Priority:</strong>"
        )

        .replace(
            /Summary:/gi,
            "<strong>Summary:</strong>"
        )

        .replace(
            /Suggested Action:/gi,
            "<strong>Suggested Action:</strong>"
        );

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// =========================================================
// FIREBASE ERROR MESSAGE
// =========================================================

function getFirebaseError(error) {

    switch (error.code) {

        case "auth/email-already-in-use":

            return "This email is already registered.";


        case "auth/invalid-email":

            return "Please enter a valid email.";


        case "auth/weak-password":

            return "Password must contain at least 6 characters.";


        case "auth/invalid-credential":

            return "Invalid email or password.";


        case "auth/user-not-found":

            return "No account found with this email.";


        case "auth/wrong-password":

            return "Incorrect password.";


        case "auth/too-many-requests":

            return "Too many attempts. Please try again later.";


        case "auth/network-request-failed":

            return "Network error. Please check your internet connection.";


        default:

            return (
                error.message ||
                "Something went wrong. Please try again."
            );

    }

}


// =========================================================
// READY
// =========================================================

console.log(
    "✅ Firebase initialized."
);

console.log(
    "🔥 Auth ready."
);

console.log(
    "📋 Complaint system ready."
);
