import { initializeApp } from 'firebase/app';
import {
    getFirestore, collection, getDocs, serverTimestamp
} from 'firebase/firestore';

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
    initializeApp(firebaseConfig);
    
    // init services
    const db = getFirestore();
    
    // get ref to db collection
    const drawTable = collection(db, 'draws');
    const rangeGroupsTable = collection(db, 'rangeGroups');
    const commonPairsTable = collection(db, 'seqPairs');

    function getDraws() {
        // get data in that collection
        return getDocs(drawTable)
        .then((snapshot) => {
            if (snapshot.empty) {
                return [];
            } else {
                const draws = snapshot.docs.map(draw => {
                    return { ...draw.data(), id: draw.id, date: draw.data().date.toDate() };
                });
                return draws.sort((a, b) => {
                    if (a.date === b.date) {
                        return 0;
                    }
                    if (a.date > b.date) {
                        return -1;
                    } else {
                        return 1;
                    }
                });
            }
        });
    }

    function getCommonPairs() {
        return getDocs(commonPairsTable)
        .then((snapshot) => {
            if (snapshot.empty) {
                return [];
            } else {
                const pairs = snapshot.docs.map(commonPair => {
                    return { 
                        ball1: Number(commonPair.data().ball1), 
                        ball2: Number(commonPair.data().ball2), count: 1  };
                });
                return pairs;
            }
        });
    }

    function getPatterns() {
        return getDocs(rangeGroupsTable)
        .then((snapshot) => {
            if (snapshot.empty) {
                console.log('no records found');
                return [];
            } else {
                let digitCount = 0;
                let tensCount = 0;
                let twentiesCount = 0;
                let thirtiesCount = 0;

                const patterns = snapshot.docs.map(pattern => {
                    const data = pattern.data();

                    digitCount += Number(data.digits);
                    tensCount += Number(data.tens);
                    twentiesCount += Number(data.twenties);
                    thirtiesCount += Number(data.thirties);

                    const patternData = { 
                        ...data, 
                        id: pattern.id, 
                        date: data.date.toDate(),
                        toString: `${data.digits}-${data.tens}-${data.twenties}-${data.thirties}`
                    };

                    return patternData;
                });

                return patterns;
            }
        })
        .catch(err => {
            console.log(err);
        });
    }

    return {
        fetchLottoDraws: function() {
            return getDraws();
        },

        fetchNumberPatterns: function() {
            return getPatterns();
        },

        fetchCommonPairs: function() {
            return getCommonPairs();
        }
    }
})();

const uiController = (function() {
    let dateRangeStartIndex = 1;

    function displayResults(draws, startIndex) {
        for(let x = 1; x <= 6; x++) {
            let resDate = draws[startIndex-1 + (x - 1)].date.toDateString();
            document.querySelector(`#draw${x}-date`).innerHTML = resDate.slice(0, resDate.length -5);
            const balls = draws[startIndex-1 + (x - 1)].balls.split('-');
            document.querySelector(`#draw${x}-ball1`).innerHTML = balls[0];
            document.querySelector(`#draw${x}-ball2`).innerHTML = balls[1];
            document.querySelector(`#draw${x}-ball3`).innerHTML = balls[2];
            document.querySelector(`#draw${x}-ball4`).innerHTML = balls[3];
            document.querySelector(`#draw${x}-ball5`).innerHTML = balls[4];
            document.querySelector(`#draw${x}-ball6`).innerHTML = balls[5];
            document.querySelector(`#draw${x}-bonus-ball`).innerHTML = draws[startIndex-1 + (x - 1)].bonus;
            document.querySelector(`#draw${x}-power-ball`).innerHTML = draws[startIndex-1 + (x - 1)].powerBall;

            for(let borderColorLoop = 0; borderColorLoop < 6; borderColorLoop++) {
                addBallBorderColorClass(Number(balls[borderColorLoop]), `#draw${x}-ball${borderColorLoop+1}-container`);
            }
        }
        dateRangeStartIndex = startIndex;
    }

    const displayResultsWithNewDateRange = (draws, startIndex) => {
        displayResults(draws, startIndex);
    }

    function displayCommonPairs(commonPairs) {
        for(let x = 0; x <= 8; x++) {
            document.querySelector(`#pair-pos${x+1}-ball1`).innerHTML = commonPairs[x].ball1;
            document.querySelector(`#pair-pos${x+1}-ball2`).innerHTML = commonPairs[x].ball2;
            document.querySelector(`#pair-pos${x+1}-count`).innerHTML = `x ${commonPairs[x].count}`;

            addBallBorderColorClass(Number(commonPairs[x].ball1), `#pair-pos${x+1}-ball1-container`);
            addBallBorderColorClass(Number(commonPairs[x].ball2), `#pair-pos${x+1}-ball2-container`);
        }
    }

    function displayPatterns(patterns) {
        for(let x = 0; x < 8; x++) {
            document.querySelector(`#pattern-pos${x+1}-ball1`).innerHTML = patterns[x].digits;
            document.querySelector(`#pattern-pos${x+1}-ball2`).innerHTML = patterns[x].tens;
            document.querySelector(`#pattern-pos${x+1}-ball3`).innerHTML = patterns[x].twenties;
            document.querySelector(`#pattern-pos${x+1}-ball4`).innerHTML = patterns[x].thirties;
            document.querySelector(`#pattern-pos${x+1}-count`).innerHTML = patterns[x].count;
        }
    }

    function addBallBorderColorClass(value, selector) {
        document.querySelector(selector).classList.remove('single-digit-color');
        document.querySelector(selector).classList.remove('ten-digit-color');
        document.querySelector(selector).classList.remove('twenty-digit-color');
        document.querySelector(selector).classList.remove('thirty-digit-color');

        if (value <= 10) {
            document.querySelector(selector).classList.add('single-digit-color');
        } else if (value > 10 && value <= 20) {
            document.querySelector(selector).classList.add('ten-digit-color');
        } else if (value > 20 && value <= 30) {
            document.querySelector(selector).classList.add('twenty-digit-color');
        } else if (value > 30) {
            document.querySelector(selector).classList.add('thirty-digit-color');
        }
    }

    function addMenuClickEventHandler() {
        const menu = document.querySelector('.hamburger-menu');
        menu.addEventListener('click', () => {
            menu.classList.toggle('change');
            document.querySelector('.menu-container').classList.toggle('change');
            document.querySelectorAll('.line').forEach((x) => x.classList.toggle('change'));
        });
    }

    function addCloseEventForMenuOptionClickEventHandler(id) {
        document.querySelector(`#${id}`).addEventListener('click', () => {
            document.querySelector('.hamburger-menu').classList.toggle('change');
            document.querySelector('.menu-container').classList.toggle('change');
            document.querySelectorAll('.line').forEach((x) => x.classList.toggle('change'));
        });
    }

    const moveDrawDate = (allDraws, isForward) => {
        let newStartIndex = dateRangeStartIndex;

        if (isForward) {
            if (dateRangeStartIndex === 1) {
                return;
            }
            newStartIndex = dateRangeStartIndex - 1;
        } else {
            newStartIndex = dateRangeStartIndex + 1;
        }

        displayResultsWithNewDateRange(allDraws, newStartIndex);
    }

    return {
        displayResults: function(draws, startIdx) {
            return displayResults(draws, startIdx);
        },

        displayCommonPairs: function(commonPairs) {
            return displayCommonPairs(commonPairs);
        },

        displayPatterns: function(patterns) {
            return displayPatterns(patterns);
        },

        moveDrawDate: function(draws, direction) {
            return moveDrawDate(draws, direction);
        },

        addEventHandlers: function() {
            addMenuClickEventHandler();
            addCloseEventForMenuOptionClickEventHandler('home-link');
            addCloseEventForMenuOptionClickEventHandler('numbers-link');
            addCloseEventForMenuOptionClickEventHandler('about-link');
        }
    }

})();

const siteController = (function(db, ui) {

    let dateRangeStartIndex= 1;

    function init() {
        ui.addEventHandlers();

        const draws = db.fetchLottoDraws();
        draws.then(d => {
            document.querySelector('#draw-result-move-date-range-forward').addEventListener('click', () => {
                ui.moveDrawDate(d, false);
            });
            document.querySelector('#draw-result-move-date-range-back').addEventListener('click', () => {
                ui.moveDrawDate(d, true);
            });
            ui.displayResults(d, dateRangeStartIndex);
        });

        db.fetchCommonPairs()
            .then(pairs => {
                const groupedPairs = pairs.reduce((prev, curr) => {
                    // have we already grouped current values
                    if (prev.length > 0 && prev.findIndex(x => x.ball1 === curr.ball1 && x.ball2 === curr.ball2) !== -1) {
                        return prev;
                    }
                    const count = pairs.filter(x => x.ball1 === curr.ball1 && x.ball2 === curr.ball2).length;
                    prev.push({ ball1: curr.ball1, ball2: curr.ball2, count });
                    return prev.sort((a, b) => {
                        if (a.count === b.count) {
                            return 0;
                        }
                        return b.count - a.count;
                    });
                }, []);

                ui.displayCommonPairs(groupedPairs);
            });

        db.fetchNumberPatterns()
            .then(patterns => {
                // use reduce to build a grouped set. The return of prev is important
                const groupedPatterns = patterns.reduce((prev, curr) => {
                    // ignore if already grouped
                    if (prev.length > 0 && prev.findIndex(x => 
                        x.digits === curr.digits && x.tens === curr.tens &&
                        x.twenties === curr.twenties && x.thirties === curr.thirties) !== -1) {
                        return prev;
                    }

                    // grab the number of matching rows as the count prop of returned object
                    const count = patterns.filter(x => 
                        x.digits === curr.digits && x.tens === curr.tens &&
                        x.twenties === curr.twenties && x.thirties === curr.thirties)
                        .length;

                    // add pattern and count to output
                    prev.push({ 
                        digits: curr.digits, 
                        tens: curr.tens,
                        twenties: curr.twenties,
                        thirties: curr.thirties,
                        count
                        });

                    return prev.sort((a, b) => {
                        if (a.count === b.count) {
                            return 0;
                        }
                        return b.count - a.count;
                    });

                }, []);

                ui.displayPatterns(groupedPatterns);
            });
    }

    return {
        init: function() {
            return init();
        }
    }

})(firebaseController, uiController);

siteController.init();
