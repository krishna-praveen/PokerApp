/*
 * Copyright 2018 The boardgame.io Authors.
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import React from 'react';
import { Client } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import './index.css';
import sampleBoard from './boardhere.js';
import {pokerGame} from './game.js';

const code = `{
  turn: { activePlayers: ActivePlayers.ALL_ONCE },
}
`;

const Description = () => (
    <div>
        <pre>{code}</pre>
    </div>
);


const allOnce = {
    description: Description,
    game: {
        setup: (setupData) => ({ playerPots: new Array(6).fill(500),
            potOnTable: 100,
            smallBlind: 5,
            bigBlind: 10,
            dealerPos: 0,
            playerFoldedStatus: new Array(getNumPlayers()).fill(0),
            playerInGameStatus: new Array(getNumPlayers()).fill(1),
            cards : make_deck(),
            boardcards:[],
            numberOfPlayers: setupData.numPlayers,
            setupdata:setupData,
            deck_index:0,
            playerObjs: make_players(),


        }),
        moves: {
            move: G => G,
            BetThisMuchAmount,
        },

        phases: {
            PreFlop: {
                moves: { BetThisMuchAmount },
                endIf: G => G.potOnTable <= 0,
                next: 'play',
                start: true,
            },


            play: {
                moves: { BetAmount },
                endIf: G => G.potOnTable >= 100,
            },
        },

        turn: { moveLimit:1},

        events: {
            endPhase: false,
        },
    },
};

function make_deck () {
    let cards=[];
    let i;
    let j = 0;
    for (i = 2; i < 15; i++) {
        cards[j++] = "h" + i;
        cards[j++] = "d" + i;
        cards[j++] = "c" + i;
        cards[j++] = "s" + i;
    }
    return cards;
}

function new_shuffle (G) {
    function get_random_int (max) {
        return Math.floor(Math.random() * max);
    }
    var len = G.cards.length;
    for (var i = 0; i < len; ++i) {
        var j = i + get_random_int(len - i);
        var tmp = G.cards[i];
        G.cards[i] = G.cards[j];
        G.cards[j] = tmp;
    }
}

function shuffle (G) {
    new_shuffle();
    G.deck_index = 0;
}


function make_players() {
    let numplayers = getNumPlayers();
    let playerObjs = {};
    let names = ["Adam","Eve","Jesus","Moses","Yehova","Satan"]
    for (let i = 0; i < numplayers; i++) {
        playerObjs[i] = {
            "name":names[i],
            "bankroll":0,
            "carda":"",
            "cardb":"",
            "status":"",
            "total_bet":"",
            "subtotal_bet":"",
        }
    }
    return playerObjs;

}


function BetThisMuchAmount(G, ctx, amount){
    G.potOnTable = G.potOnTable+Number(amount);
    G.playerPots[ctx.currentPlayer] = G.playerPots[ctx.currentPlayer]-Number(amount);
}


function CheckTurn(G,ctx){
    ctx.events.endTurn();
}

function GetAmount(G, ctx) {
    G.potOnTable--;
    G.playerPots[ctx.currentPlayer]++;
}

function BetAmount(G, ctx) {
    G.potOnTable++;
    G.playerPots[ctx.currentPlayer]--;
}


function getNumPlayers(){
    return 6;
}

function testNumplayers(G) {
    let n = G.setupData.numPlayers;
    return n;
}

const examples = {
    'all-once': allOnce,
};

class App extends React.Component {
    constructor(props) {
        super(props);
        // Changed here from this.init('all') to this.init('all-once')
        // this.init('all');
        this.init('all-once');
    }

    init(type) {
        let shouldUpdate = false;
        if (this.client !== undefined) {
            shouldUpdate = true;
        }

        this.type = type;
        this.description = examples[type].description;
        this.client = Client({
            game: pokerGame.game,
            numPlayers: getNumPlayers(),
            somethingsomething: 88,
            debug: false,
            board: sampleBoard,
            multiplayer: Local(),
            enhancer: (window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()),

        });


        if (shouldUpdate) {
            this.forceUpdate();
        }
    }

    render() {
        const Description = this.description;
        const App = this.client;

        let players = [];
        for (let i = 0; i < 6; i++) {
            players.push(<App key={i} gameID={this.type} playerID={i + ''} />);
        }

        return (
            <div>

                <div id="turnorder">
                    <div className="turnorder-options">
                        <div
                            className={this.type === 'all-once' ? 'active' : ''}
                            onClick={() => this.init('all-once')}
                        >
                            ALL_ONCE
                        </div>
                        {/*<div*/}
                        {/*    className={this.type === 'all' ? 'active' : ''}*/}
                        {/*    onClick={() => this.init('all')}*/}
                        {/*>*/}
                        {/*    ALL*/}
                        {/*</div>*/}

                        {/*<div*/}
                        {/*    className={this.type === 'others' ? 'active' : ''}*/}
                        {/*    onClick={() => this.init('others')}*/}
                        {/*>*/}
                        {/*    OTHERS*/}
                        {/*</div>*/}
                        {/*<div*/}
                        {/*    className={this.type === 'others-once' ? 'active' : ''}*/}
                        {/*    onClick={() => this.init('others-once')}*/}
                        {/*>*/}
                        {/*    OTHERS_ONCE*/}
                        {/*</div>*/}
                    </div>

                    <div className="turnorder-content">
                        <div className="player-container">
                            <App gameID={this.type} />
                            <span>{players}</span>
                        </div>

                        {/*<div class="phase">*/}
                        {/*    <div>{this.client.ctx}</div>*/}
                        {/*</div>*/}
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
