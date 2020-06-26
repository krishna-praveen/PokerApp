import React from "react";
// import "./index.css";
import { Client } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import { render } from "react-dom";
import { SocketIO } from "boardgame.io/multiplayer";
import sampleBoard from './boardhere.js';
import {pokerGame} from './game.js';
import ReactDom from 'react-dom';




// const pokerClient = Client({
//     game: pokerGame.game,
//     board: sampleBoard,
//     numPlayers:2,
//     multiplayer: SocketIO({server:'localhost:8000'})
// });

class App extends React.Component{
    constructor(props){
        super(props);
        this.state = { playerID: null, connectedCount:0};
        this.init();
    }

    init(){
        this.type = 'all-once';
        this.client = Client({
            game: pokerGame,
            board: sampleBoard,
            numPlayers: 6,
            debug: false,
            multiplayer: SocketIO({server:'localhost:8000'})
        });

    }

    handleClick(i){
        const currentlyConnected = this.state.connectedCount;

    }


    render() {
        if (this.state.playerID === null) {
            return (
                <div>
                    <p>Play as</p>
                    <button onClick={() => this.setState({ playerID: "0" })}>
                        Player 0
                    </button>
                    <button onClick={() => this.setState({ playerID: "1" })}>
                        Player 1
                    </button>
                    <button onClick={() => this.setState({ playerID: "2" })}>
                        Player 2
                    </button>
                    <button onClick={() => this.setState({ playerID: "3" })}>
                        Player 3
                    </button>
                    <button onClick={() => this.setState({ playerID: "4" })}>
                        Player 4
                    </button>
                    <button onClick={() => this.setState({ playerID: "5" })}>
                        Player 5
                    </button>
                </div>
            );
        }

        const App = this.client;
        let players = []

        for (let i=0; i<6; i++){
            players.push(<App key={i} gameID={this.type} playerID={i + ''} />)

        }


        return (
            <div>
                <div id="turnorder">
                    <div className="turnorder-options">
                        <div
                            className={this.type === 'all-once' ? 'active' : ''}
                            onClick={() => this.init()}
                        >
                            ALL_ONCE
                        </div>
                            
                    </div>
                </div>

                <div className="turnorder-content">
                    <div className="player-container">
                        <App gameID={this.type} />
                        <span>{players}</span>
                    </div>
                </div>
            
            </div>
            
        );
    }
}

class App2 extends React.Component {
    constructor(props) {
        super(props);
        // Changed here from this.init('all') to this.init('all-once')
        // this.init('all');
        this.init('poker-game');
        this.state = {playerID:null};
        
    }

    init(type) {
        let shouldUpdate = false;
        if (this.client !== undefined) {
            shouldUpdate = true;
        }

        this.type = type;
        this.description = "THis is description";
        this.client = Client({
            game: pokerGame,
            numPlayers: 6,
            somethingsomething: 88,
            debug: true,
            board: sampleBoard,
            multiplayer: Local(),
        });


        if (shouldUpdate) {
            this.forceUpdate();
        }
    }

    render() {
        const Description = this.description;
        const App = this.client;

        if (this.state.playerID === null) {
            return (
                <div>
                    <p>Play as</p>
                    <button onClick={() => this.setState({ playerID: "0" })}>
                        Player 0
                    </button>
                    <button onClick={() => this.setState({ playerID: "1" })}>
                        Player 1
                    </button>
                    <button onClick={() => this.setState({ playerID: "2" })}>
                        Player 2
                    </button>
                    <button onClick={() => this.setState({ playerID: "3" })}>
                        Player 3
                    </button>
                    <button onClick={() => this.setState({ playerID: "4" })}>
                        Player 4
                    </button>
                    <button onClick={() => this.setState({ playerID: "5" })}>
                        Player 5
                    </button>
                </div>
            );
        }

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
                    </div>

                    <div className="turnorder-content">
                        <div className="player-container">
                            <App key={"jjkka"} gameID={this.type} />
                            <span>{players}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

ReactDom.render(
    <React.StrictMode>
        <App2/>
    </React.StrictMode>,
    document.getElementById('root')
);
// render(<App/>, document.getElementById('root'));

