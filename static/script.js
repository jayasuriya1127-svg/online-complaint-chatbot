// =========================================================
// ONLINE COMPLAINT - FRONTEND CONTROLLER
// =========================================================

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

const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getFirestore(app);


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


            const name =
                document.getElementById(
                    "registerName"
                ).value.trim();


            const email =
                document.getElementById(
                    "registerEmail"
                ).value.trim();


            const password =
                document.getElementById(
                    "registerPassword"
                ).value;


            const message =
                document.getElementById(
                    "registerMessage"
                );


            if (!name || !email || !password) {

                message.className =
                    "message-box error";

                message.innerText =
                    "Please fill all fields.";

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


                // Set display name
                await updateProfile(
                    user,
                    {
                        displayName: name
                    }
                );


                // Save user data in Firestore
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


                message.className =
                    "message-box success";

                message.innerText =
                    "Account created successfully!";


                setTimeout(
                    function() {

                        window.location.href =
                            "/dashboard";

                    },
                    1200
                );


            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );


                message.className =
                    "message-box error";

                message.innerText =
                    getFirebaseError(error);

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


            const email =
                document.getElementById(
                    "loginEmail"
                ).value.trim();


            const password =
                document.getElementById(
                    "loginPassword"
                ).value;


            const message =
                document.getElementById(
                    "loginMessage"
                );


            if (!email || !password) {

                message.className =
                    "message-box error";

                message.innerText =
                    "Please enter email and password.";

                return;
            }


            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


                message.className =
                    "message-box success";

                message.innerText =
                    "Login successful!";


                setTimeout(
                    function() {

                        window.location.href =
                            "/dashboard";

                    },
                    800
                );


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                message.className =
                    "message-box error";

                message.innerText =
                    getFirebaseError(error);

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
                "Logout error:",
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
                await response.json();


            if (data.success) {

                result.className =
                    "ai-result show";

                result.innerHTML =
                    formatAIResponse(
                        data.analysis
                    );

            } else {

                result.className =
                    "ai-result show";

                result.innerHTML =
                    "❌ " +
                    escapeHTML(
                        data.message ||
                        "AI analysis failed."
                    );

            }


        } catch (error) {

            console.error(
                "Gemini error:",
                error
            );


            result.className =
                "ai-result show";

            result.innerHTML =
                "❌ Unable to connect to AI.";

        }

    };


// =========================================================
// COMPLAINT SUBMIT
// =========================================================

const complaintForm =
    document.getElementById(
        "complaintForm"
    );


if (complaintForm) {

    complaintForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            // Prevent duplicate submissions
            if (
                complaintForm.dataset.submitting ===
                "true"
            ) {

                return;

            }


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


            const title =
                titleElement
                    ? titleElement.value.trim()
                    : "";


            const category =
                categoryElement
                    ? categoryElement.value
                    : "";


            const description =
                descriptionElement
                    ? descriptionElement.value.trim()
                    : "";


            const user =
                auth.currentUser;


            // Check login
            if (!user) {

                if (message) {

                    message.className =
                        "message-box error";

                    message.innerText =
                        "Please login first.";

                }

                return;

            }


            // Validate
            if (!title || !description) {

                if (message) {

                    message.className =
                        "message-box error";

                    message.innerText =
                        "Please fill complaint title and description.";

                }

                return;

            }


            try {

                // Lock form
                complaintForm.dataset.submitting =
                    "true";


                const submitButton =
                    complaintForm.querySelector(
                        'button[type="submit"]'
                    );


                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.innerText =
                        "Submitting...";

                }


                // Send complaint to Flask
                const response =
                    await fetch(
                        "/submit-complaint",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    userId:
                                        user.uid,

                                    name:
                                        user.displayName ||
                                        "Student",

                                    email:
                                        user.email,

                                    title:
                                        title,

                                    description:
                                        description,

                                    category:
                                        category

                                })

                        }
                    );


                const data =
                    await response.json();


                console.log(
                    "Complaint response:",
                    data
                );


                if (response.ok && data.success) {

                    if (message) {

                        message.className =
                            "message-box success";

                        message.innerText =
                            "Complaint submitted successfully! ID: " +
                            data.complaintId;

                    }


                    // Reset form
                    complaintForm.reset();


                    // Go dashboard
                    setTimeout(
                        function() {

                            window.location.href =
                                "/dashboard";

                        },
                        1200
                    );


                } else {

                    throw new Error(
                        data.message ||
                        "Complaint submission failed."
                    );

                }


            } catch (error) {

                console.error(
                    "Complaint submit error:",
                    error
                );


                if (message) {

                    message.className =
                        "message-box error";

                    message.innerText =
                        error.message ||
                        "Something went wrong.";

                }


                // Unlock form
                complaintForm.dataset.submitting =
                    "false";


                const submitButton =
                    complaintForm.querySelector(
                        'button[type="submit"]'
                    );


                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.innerText =
                        "Submit Complaint";

                }

            }

        }
    );

}


// =========================================================
// DASHBOARD - LOAD COMPLAINTS
// =========================================================

async function loadDashboardComplaints() {

    const complaintList =
        document.getElementById(
            "complaintList"
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


        const response =
            await fetch(
                "/complaints"
            );


        if (!response.ok) {

            throw new Error(
                "Failed to fetch complaints."
            );

        }


        const data =
            await response.json();


        console.log(
            "📦 Complaints API:",
            data
        );


        if (!data.success) {

            throw new Error(
                data.error ||
                "Unable to load complaints."
            );

        }


        let complaints =
            data.complaints || [];


        // =====================================================
        // FILTER CURRENT USER
        // =====================================================

        const currentUser =
            auth.currentUser;


        if (currentUser) {

            complaints =
                complaints.filter(
                    function(complaint) {

                        return (
                            complaint.userId ===
                            currentUser.uid
                        );

                    }
                );

        }


        console.log(
            "👤 Current user complaints:",
            complaints
        );


        // =====================================================
        // STATISTICS
        // =====================================================

        const total =
            complaints.length;


        const pending =
            complaints.filter(
                function(complaint) {

                    return (
                        String(
                            complaint.status || ""
                        )
                            .toLowerCase() ===
                        "pending"
                    );

                }
            ).length;


        const progress =
            complaints.filter(
                function(complaint) {

                    const status =
                        String(
                            complaint.status || ""
                        )
                            .toLowerCase()
                            .replace(
                                /\s+/g,
                                ""
                            );

                    return (
                        status ===
                        "inprogress"
                    );

                }
            ).length;


        const resolved =
            complaints.filter(
                function(complaint) {

                    return (
                        String(
                            complaint.status || ""
                        )
                            .toLowerCase() ===
                        "resolved"
                    );

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


        // =====================================================
        // EMPTY
        // =====================================================

        if (complaints.length === 0) {

            complaintList.innerHTML = `

                <div class="empty-state">

                    <div>📭</div>

                    <h3>No complaints yet</h3>

                    <p>
                        Submit your first complaint
                        to get started.
                    </p>

                </div>

            `;

            return;

        }


        // =====================================================
        // SORT LATEST FIRST
        // =====================================================

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


        // =====================================================
        // DISPLAY
        // =====================================================

        complaintList.innerHTML =
            complaints
                .map(
                    function(complaint) {

                        const status =
                            complaint.status ||
                            "Pending";


                        const statusClass =
                            String(status)
                                .toLowerCase()
                                .replace(
                                    /\s+/g,
                                    "-"
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
                                    complaint.createdAt;

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
                                        class="status ${statusClass}"
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


        complaintList.innerHTML = `

            <div class="empty-state">

                <div>❌</div>

                <h3>Unable to load complaints</h3>

                <p>
                    Please refresh the page and try again.
                </p>

            </div>

        `;

    }

}


// =========================================================
// DASHBOARD AUTH STATE
// =========================================================

onAuthStateChanged(
    auth,
    async function(user) {

        const userName =
            document.getElementById(
                "userName"
            );


        // User logged in
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


            // Load dashboard
            await loadDashboardComplaints();

        }

    }
);


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
            /Category:/g,
            "<strong>Category:</strong>"
        )

        .replace(
            /Priority:/g,
            "<strong>Priority:</strong>"
        )

        .replace(
            /Summary:/g,
            "<strong>Summary:</strong>"
        )

        .replace(
            /Suggested Action:/g,
            "<strong>Suggested Action:</strong>"
        );

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(value) {

    return String(value)

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


        default:

            return (
                error.message ||
                "Something went wrong. Please try again."
            );

    }

}


// =========================================================
// CONSOLE READY MESSAGE
// =========================================================

console.log(
    "🚀 Online Complaint frontend loaded successfully"
);