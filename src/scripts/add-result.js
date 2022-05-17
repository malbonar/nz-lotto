import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseController = (function() {
    const firebaseConfig = {
        apiKey: "api-key-here",
        authDomain: "my-domain.com",
        projectId: "my-project-id",
        storageBucket: "my-storage-bucket",
        messagingSenderId: "message-id",
        appId: "app-id",
        measurementId: "measurement-id"
    };    

    try {
        // Load firebase secrets from config file
        const secrets = require('../firebase-config.json');
        
        // Override default config with values from the secrets file
        Object.assign(firebaseConfig, secrets);
    } catch (e) { }
    
    // init firebase
    const firebase = initializeApp(firebaseConfig);
    
    // init services
    const db = getFirestore();
    const auth = getAuth(firebase);

    const login = async(email, password) => {
        try {
            const user = await signInWithEmailAndPassword(auth, email, password);
            console.log('login success');
            return {
                success: true,
                error: undefined,
                user
            }
        } catch(error) {
            console.log('login failed');
            return {
                success: false,
                error,
                user: undefined
            }
        }
    }

    const monitorAuthState = async() => {
        onAuthStateChanged(auth, user => {
            if (user) {
                // logged in
                console.log('logged in');
            } else {
                console.log('logged out');
            }
        });
    }
    
    // get ref to db collection
    const draws = collection(db, 'draws');
    const seqPairs = collection(db, 'seqPairs');
    const rangeGroups = collection(db, 'rangeGroups');

    return {
        monitorAuthState: function() {
            return monitorAuthState();
        },

        login: async function(email, password) {
            return login(email, password);
        },

        getDrawsTable: function() {
            return draws;
        },

        getSeqPairs: function() {
            return seqPairs;
        },

        getRangeGroups: function() {
            return rangeGroups;
        }
    }
})();

const uiController = (function() {
    const HideSaveDialogClassname = 'hide-save-dialog';
    const DOMStrings = {
        addLottoResultForm: '.add-lotto-result-form',
        saveOkBtnClass: '.saved-confirmation-btn',
        loginUsername: '#login-username',
        loginPassword: '#login-password',
    };

    const addLottoResultForm = document.querySelector(DOMStrings.addLottoResultForm);
    const saveOkBtn = document.querySelector(DOMStrings.saveOkBtnClass);
    const backdrop = document.querySelector('.modal-backdrop');
    const saveDialog = document.querySelector('.saved-confirmation-container');
    const resultDate = document.querySelector('#resultDateInput');
    const usernameInput = document.querySelector(DOMStrings.loginUsername);
    const passwordInput = document.querySelector(DOMStrings.loginPassword);
    const loginBtn = document.querySelector('#login-btn');

    function getDrawNumbers() {
        return [
            addLottoResultForm.ball1.value,
            addLottoResultForm.ball2.value,
            addLottoResultForm.ball3.value,
            addLottoResultForm.ball4.value,
            addLottoResultForm.ball5.value,
            addLottoResultForm.ball6.value
        ];
    }

    function reset() {
        addLottoResultForm.ball1.value = '';
        addLottoResultForm.ball2.value = '';
        addLottoResultForm.ball3.value = '';
        addLottoResultForm.ball4.value = '';
        addLottoResultForm.ball5.value = '';
        addLottoResultForm.ball6.value = '';
        addLottoResultForm.bonusBall.value = '';
        addLottoResultForm.powerBall.value = '';
        resultDate.value = '';
    }

    function showSaveDialog() {
        backdrop.classList.remove(HideSaveDialogClassname);
        saveDialog.classList.remove(HideSaveDialogClassname);
    }

    function hideSaveDialog() {
        backdrop.classList.add(HideSaveDialogClassname);
        saveDialog.classList.add(HideSaveDialogClassname);
    }
    
    function getNumberLessThan10Count(numbers) {
        return numbers.filter(n => n > 0 && n <= 10).length;
    }
    
    function getTens(numbers) {
        return numbers.filter(n => n > 10 && n <= 20).length;
    }
    
    function getTwenties(numbers) {
        return numbers.filter(n => n > 20 && n <= 30).length;
    }
    
    function getThirties(numbers) {
        return numbers.filter(n => n > 30 && n <= 40).length;
    }
    
    function getPattern(numbers) {
        const digits = getNumberLessThan10Count(numbers);
        const tens = getTens(numbers);
        const twenties = getTwenties(numbers);
        const thirties = getThirties(numbers);
    
        return `${digits}-${tens}-${twenties}-${thirties}`;
    } 

    function getAdjacentNumbers(numbers) {
        if (numbers === null || numbers === undefined) {
            return;
        }
        if (numbers.length === 0) {
            return;
        }
        const numArr = [...numbers];
        const results = [];

         for(let x = 0; x < numbers.length; x++) {
             const target = numbers[x];
             for(let y = x + 1; y < numbers.length; y++) {
                const numberFromLoop = numbers[y];
                if (Math.abs(target - numberFromLoop) === 1) {
                    // add number pair
                    results.push({ ball1: target, ball2: numberFromLoop });
                }
             }
         }

         return results;
    }

    // this to be done once logged in
    const setupEventListeners = function(draws, groups, seqPairs) {

        const addForm = addLottoResultForm;
        addForm.addEventListener('submit', e => {
            e.preventDefault();
            const resultDate = new Date(addForm.resultDate.value);  
            const drawNumbers = getDrawNumbers();  
            addDoc(draws, {
                date: Timestamp.fromDate(resultDate),
                balls: `${addForm.ball1.value}-${addForm.ball2.value}-${addForm.ball3.value}-${addForm.ball4.value}-${addForm.ball5.value}-${addForm.ball6.value}`,
                bonus: addForm.bonusBall.value,
                pattern: getPattern(drawNumbers),
                powerBall: addForm.powerBall.value
            })
            .then(res => {
                console.log(`draw result saved`);
                addDoc(groups, {
                    date: Timestamp.fromDate(resultDate),
                    digits: getNumberLessThan10Count(drawNumbers),
                    tens: getTens(drawNumbers),
                    twenties: getTwenties(drawNumbers),
                    thirties: getThirties(drawNumbers)
                })
                .then(res2 => {
                    console.log(`range group saved`);        
                    const pairs = getAdjacentNumbers(drawNumbers);
                    if (pairs.length === 0) {
                        showSaveDialog();
                        reset();
                    }

                    pairs.forEach(p => {
                        addDoc(seqPairs, {
                            date: Timestamp.fromDate(resultDate),
                            ball1: p.ball1,
                            ball2: p.ball2
                        })
                        .then(res3 => {
                            showSaveDialog();
                            reset();
                            console.log(`seqPairs saved`);
                        })
                        .catch(err3 => {
                            console.log('seqPairs save failed!');
                            console.log(err3);
                        });
                    });
                })
                .catch(err2 => {
                    console.log('range group save failed!');
                    console.log(err2);
                })
            })
            .catch(err => {
                console.log('draw result save failed!')
                console.log(err);
            });
        });

        saveOkBtn.addEventListener('click', e => {
            e.preventDefault();
            hideSaveDialog();
        });
    }

    function setupLoginFormEventHandlers() {
        usernameInput.addEventListener('keyup', _ => {
            if (usernameInput?.value?.length > 0 && passwordInput?.value?.length > 0) {
                loginBtn.disabled = false;
            } else {
                loginBtn.disabled = true;
            }
        });

        passwordInput.addEventListener('keyup', _ => {
            if (usernameInput?.value?.length > 0 && passwordInput?.value?.length > 0) {
                loginBtn.disabled = false;
            } else {
                loginBtn.disabled = true;
            }
        });
    }

    return {
        getDomStrings: function() {
            return DOMStrings;
        },

        setupEventListeners,
        setupLoginFormEventHandlers,
        saveOkBtn: saveOkBtn,
    }
})();

const loginController = (function(db, userInputCtrl) {
    
    const loginBtn = document.querySelector('#login-btn');
    const loginForm = document.querySelector('#login-form');        
    const usernameInput = document.querySelector('#login-username');    
    const passwordInput = document.querySelector('#login-password');
  
    function setupEventHandlers() {
        loginBtn.addEventListener('click', e => {
            e.preventDefault;
            db.monitorAuthState();
            db.login(usernameInput.value, passwordInput.value)
                .then(res => {
                    if (res.success) {
                        userInputCtrl.setupEventListeners(db.getDrawsTable(), db.getRangeGroups(), db.getSeqPairs());
                        // hide login form
                        if (!loginForm.classList.contains('hide')) {
                            loginForm.classList.add('hide');
                        }

                    } else {
                        console.log(res.error);
                        if (loginForm.classList.contains('hide')) {
                            loginForm.classList.remove('hide');
                        }
                    }
                })
                .catch(err => {
                    console.log(err);
                });
        });
    }

    return {
        setupEventHandlers,
    }
})(firebaseController, uiController);

// setup login event listeners
uiController.setupLoginFormEventHandlers();
loginController.setupEventHandlers();


