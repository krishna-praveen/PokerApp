import React , { useState, useEffect }from 'react';
import './index.css';
import PropTypes from 'prop-types';
import './App.css';
import Timer from './timer.js';
import styled from 'styled-components'


class Board extends React.Component {
    static propTypes = {
        G: PropTypes.any.isRequired,
        ctx: PropTypes.any.isRequired,
        events: PropTypes.any.isRequired,
        moves: PropTypes.any.isRequired,
        playerID: PropTypes.string,
        isActive: PropTypes.bool,
        isMultiplayer: PropTypes.bool,
        isConnected: PropTypes.bool,
        isPreview: PropTypes.bool,
    };



    constructor(props){
        super(props);
        this.state = {amountToBet:''};

    }





    CardsAreThere(props){
        const RedText = styled.p`color:red`;
        const cards = props.boardCards;
        if(cards.length !== null){
        //    return <div> CARDS : {cards} </div>
           return (
           <div id="board">
            <div>CARDS : {cards}</div>
            <div id="flop1" class="card boardcard"></div>
            <div id="flop2" class="card boardcard"></div>
            <div id="flop3" class="card boardcard"></div>
            <div id="turn" class="card boardcard"></div>
            <div id="river" class="card boardcard"></div>

        </div>
           )
        }
    }

    


    myChangeHandler = (event) => {
        event.preventDefault();
        this.setState({amountToBet:event.target.value})
    }

    mySubmitHandler = (event) => {
        event.preventDefault();
        alert("You are submitting " + this.state.amountToBet);
        this.props.moves.handleBet(this.state.amountToBet);

    }
    // onClick = id => {
    //   if (this.isActive(id)) {
    //     this.props.moves.clickCell(id);
    //   }
    // };
    //
    // isActive(id) {
    //   return this.props.isActive && this.props.G.cells[id] === null;
    // }


    render() {
        if (this.props.playerID === null) {
            return <div className="table-interior">
              <span>

                <span>
                    {/* <CardsAreThere boardCards={this.props.G.boardCards}/> */}
                    {this.CardsAreThere(this.props.G)}
                </span>

                
                <br></br>
                
                <Timer/>
                <br/>
                <span>
                    TablePot :  {this.props.G.potOnTable}
                    <br/>
                    To Bet : {this.props.G.currentBetAmount}
                </span>
              </span>
              
            </div>;
        }


        // The following are the component of boards here




        let className = 'player';
        let active = false;
        let current = false;
        let stage;
        let onClick = () => {};
        let alertThis = (a)=>{alert(a)};



        if (this.props.ctx.activePlayers) {
            if (this.props.playerID in this.props.ctx.activePlayers) {
                className += ' active';
                active = true;
                stage = this.props.ctx.activePlayers[this.props.playerID];
                // console.log("Active players are ", ctx.activePlayers[playerID]);
            }
        } else {
            if (this.props.playerID === this.props.ctx.currentPlayer) {
                className += ' active';
                active = true;
            }
        }

        if (this.props.playerID == this.props.ctx.currentPlayer) {
            className += ' current';
            current = true;
        }

        const moves = Object.entries(this.props.moves)
            // .filter(e => !(e[0] === 'play' && stage === 'discard'))
            .filter(e => !(e[0] === 'discard' && stage !== 'discard'))
            .filter(e => !(e[0] === 'CheckTurn' || e[0] === 'move'))
            .map(e => (
                    <div>
                        <button key={e[0]} onClick={() => e[1]()}>
                            {e[0]}
                        </button>
                        {/*
            <form onSubmit={() => e[1]()}>
            <label>
              {e[0]}:
              <input
                key = {e[0]}
                name="numberOfGuests"
                type="number"
                 />
            </label>
            </form>*/}

                    </div>
                )
                // .map(e => (console.log(e)))
            );



        const events = Object.entries(this.props.events)
            .filter(() => current && active)
            .filter(e => e[0] != 'setActivePlayers')
            .filter(e => e[0] != 'setStage')
            .filter(e => e[0] != 'endStage')
            .map(e => (
                <button key={e[0]} onClick={() => e[1]()}>
                    {e[0]}
                </button>
            ));
        
        // const QuickBets = 


        // console.log("pots are like this ", this.props.G.playerPots);
        // console.log("moves are like this ", this.props.moves);
        console.log("The current phase is ", this.props.ctx.phase);
        return (
            // console.log("pots ", this.props.G.playerPots)
            <div className="player-wrap">
              <span className={className} onClick={onClick}>
                {this.props.G.playerObjs[this.props.playerID]["bankroll"]}
                

                <span >
                    {this.props.G.playerObjs[this.props.playerID]["name"]}
                </span>
              </span>

                <div className="controls">
                    <div>
                        {/*<button onClick={() => this.props.moves.CheckTurn()}>*/}
                        {/*    {Object.keys(this.props.moves)[1]}*/}
                        {/*</button>*/}

                        <form onSubmit={this.mySubmitHandler}>
                            <label>
                                BetAmount:
                                <input
                                    key = {"BetThisMuchAmount"}
                                    name="amount"
                                    type="number"
                                    onChange = {this.myChangeHandler}
                                    value = {this.state.amountToBet}
                                />
                            </label>
                        </form>
                    </div>
                 
                    
                    {moves}
                    {/*{active && moves}*/}
                    {/*{events}*/}
                </div>
            </div>
        );

    }
}

export default Board;
