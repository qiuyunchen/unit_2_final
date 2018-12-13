class Storage {
    constructor(key) {
        this.key = key;
    }
    getStorage() {
        const data = window.localStorage.getItem(this.key);
        if (data) {
            return JSON.parse(data);
        }
        return data;
    }
    save(data) {
        window.localStorage.setItem(this.key, JSON.stringify(data))
    }
}

// ------------- GLOBAL VARIABLES
const storage = new Storage('appState');

const header = document.querySelector('.greyHeader');
const displayArea = document.querySelector('.displayContainer');
const greenBtn = document.querySelector('.greenBtn');
const deckId = document.querySelector('.deckId');
const cardsRemaining = document.querySelector('.cardsRemaing');

// ------------- STATE
const state = {
    greenBtn: 'hide',
    deckId: '',
    cardsRemaining: '',
    cardsDrawn: [],
};

// ------------- SUPPORTING FUNCTIONS
const getNewShuffledDeck = (cb) => {
    const url = 'https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1';
    let request = new XMLHttpRequest();
    request.open("GET", url);
    request.addEventListener('load', e => {
        const data = JSON.parse(e.currentTarget.response);
        cb(data);
    })
    request.send();
}

const drawCard = (deckId, cb) => {
    const url = `https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`;
    let request = new XMLHttpRequest();
    request.open("GET", url);
    request.addEventListener('load', e => {
        const data = JSON.parse(e.currentTarget.response);
        cb(data);
    });
    request.send();
}

const cardDrawnToHTML = (card) =>{
    if (card.toggleUp){
        return `
        <div class='card' jsCardId='${card.code}'>
            <p class='card_desc'>${card.value} ${card.suit}</p>
            <img src='${card.image}'>
        </div>
        `;
    }
    return `
        <div class='card' jsCardId='${card.code}'>
            <img src='${card.image}'>
            <p class='card_desc'>${card.value} ${card.suit}</p>
        </div>
    `;
}

// ------------- RENDER
const render = state => {
    if (state.greenBtn === 'show' || state.deckId){
        greenBtn.classList.remove('hidden');
    }
    if(state.deckId){
        deckId.innerHTML = `<span>Deck ID: ${state.deckId}</span>`;
        cardsRemaining.innerHTML = `<span>Cards Left in Deck: ${state.cardsRemaining}</span>`;
    }
    const cardsHTML = state.cardsDrawn.reduce( (acc,card) =>{
        return acc + cardDrawnToHTML(card);
    }, '');
    displayArea.innerHTML = cardsHTML;
}

const saveAndRender = () =>{
    storage.save(state);
    render(state);
}

// --------------------------------- EVENTS

header.addEventListener('click', e =>{
    // --------- EVENT: CLICK ON RED BUTTON TO DRAW NEW DECK
    if(e.target.value === 'New Deck'){
        getNewShuffledDeck(data => {
            state.deckId = data.deck_id;
            state.cardsRemaining = data.remaining;
            state.cardsDrawn = [];
            state.greenBtn = 'show';
            saveAndRender();
        });
    }

    // --------- EVENT: CLICK ON GREEN BUTTON TO DRAW CARD
    if(e.target.value === 'Draw Card'){
        if (state.cardsRemaining === 0){
            alert(`No more cards in the deck! Drawing new deck! 
            even if you don't want to lol`);
            getNewShuffledDeck(data =>{
                state.deckId = data.deck_id;
                state.cardsRemaining = data.remaining;
                state.cardsDrawn = [];
                saveAndRender();
            });
        }
        if (state.cardsRemaining > 0){
            drawCard(state.deckId, data =>{
                data.cards[0]['toggleUp'] = false;
                state.cardsDrawn.unshift(data.cards[0]);
                state.cardsRemaining--;
                saveAndRender();
            });
        }
    }
});

// --------- EVENT: CLICK ON CARD TO TOGGLE DISPLAY
displayArea.addEventListener('click', e =>{
    if(e.target.matches('img')){
        const cardID = e.target.parentNode.getAttribute('jsCardId');
        state.cardsDrawn.forEach((card, i) =>{
            if (card.code === cardID){
                state.cardsDrawn[i].toggleUp = !state.cardsDrawn[i].toggleUp;
            }
        });
        saveAndRender();
    }
});

// ------------- RETRIEVE SAVED STATE
const storedState = storage.getStorage();
if (storedState) {
    state.deckId = storedState.deckId;
    state.cardsRemaining = storedState.cardsRemaining;
    state.cardsDrawn = storedState.cardsDrawn;
}
render(state);