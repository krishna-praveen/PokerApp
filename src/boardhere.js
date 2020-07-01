import React , { useState, useEffect }from 'react';
import './index.css';
import PropTypes from 'prop-types';
import './App.css';
import Timer from './timer.js';
import styled from 'styled-components';

// import imageUrl from "./static/images/cardback.png";


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


    internalFixTheRanking = (rank) =>{
        var ret_rank = 'NoRank';
        if (rank === 14) {
          ret_rank = 'ace';
        } else if (rank === 13) {
          ret_rank = 'king';
        } else if (rank === 12) {
          ret_rank = 'queen';
        } else if (rank === 11) {
          ret_rank = 'jack';
        } else if (rank > 0 && rank < 11) {
          // Normal card 1 - 10
          ret_rank = rank;
        } else {
          console.log(typeof rank);
          alert('Unknown rank ' + rank);
        }
        return ret_rank;
      }
      
    internalFixTheSuiting (suit) {
        if (suit === 'c') {
          suit = 'clubs';
        } else if (suit === 'd') {
          suit = 'diamonds';
        } else if (suit === 'h') {
          suit = 'hearts';
        } else if (suit === 's') {
          suit = 'spades';
        } else {
          alert('Unknown suit ' + suit);
          suit = 'yourself';
        }
        return suit;
      }

    setCardUrl(cardNumber){
        var suit = cardNumber.substring(0,1);
        var rank = parseInt(cardNumber.substring(1));
        suit = this.internalFixTheSuiting(suit);
        rank = this.internalFixTheRanking(rank);
        // return './static/images/' + rank + '_of_' + suit + '.png';
        return rank + '_of_' + suit + '.png';

    }

    importAll(r){
      let images = {};
      r.keys().map((item, index) => { images[item.replace('./', '')] = r(item); });
      return images;
    };


    CardsAreThere(props){
        // let imgUrl = "./static/images/cardback.png";
        const cardText = styled.div`
          background-image: url(${props => props.url});
          background-size: 100%;
          border-radius: 4px;
          height: 73px;
          width: 50px;
        `;

        // https://stackoverflow.com/questions/30373343/reactjs-component-names-must-begin-with-capital-letters
        // All components must start with capital letter other wise it will consider
        // them as normal html component like div or p
        const CardGroup = styled.div`
          background-image: url(${props => props.url});
          background-size:100%;
          border-radius: 4px;
          top: -10px;
          height:73px;
          width 50px;
          background-repeat:no-repeat;
          left: ${props => props.left};
          position: absolute;

        `;

        const boardCardText = styled(cardText)`
          height: 73px;
          left: 0px;
          background-repeat: no-repeat;
          position: absolute;
          top: -10px;
          width: 50px;
          color:palevioletred;
        `;
        const cards = props.boardCards;
        const spacingArray = ["0px", "52px","104px","156px","208px"];
        // const boardEls = Object.entries()

        // Importing all the images here. We can do this outside as well
        function importAll(r){
          let images = {};
          r.keys().map((item, index) => { images[item.replace('./', '')] = r(item); });
          return images;
        };
        const imagesAll = this.importAll(require.context('./static/images', false, /\.(png|jpe?g|svg)$/));
        // console.log(imagesAll);

        // Creating the board deck here
        const cardsDeck = (cards, spacingArray) =>{
          let arr = [];
          console.log("cards are "+cards);
          for (let index = 0; index < 5; index++) {
            let defaultUrl = require('./static/images/cardback.png');
            if(cards[index] !== null && cards[index] !== undefined){
               let cardHere = this.setCardUrl(cards[index]);
               console.log(cardHere);
               defaultUrl = imagesAll[cardHere];
            }
            arr.push(
              <CardGroup left={spacingArray[index]} url={defaultUrl}></CardGroup>
            )
          }
          return arr;
        };

        // Return the 5 cards here.
        if(cards.length !== null){
        //    return <div> CARDS : {cards} </div>
           return (
              <div id="board">
                    {/* <div>CARDS : {cards}</div> */}
                    {cardsDeck(cards,spacingArray)}
              </div>
           )
        }
    }

    


    myChangeHandler = (event) => {
        event.preventDefault();
        this.setState({amountToBet:event.target.value})
    };

    mySubmitHandler = (event) => {
        event.preventDefault();
        alert("You are submitting " + this.state.amountToBet);
        this.props.moves.handleBet(this.state.amountToBet);

    };

    render() {
        if (this.props.playerID === null) {
            return (<div className="table-interior">
              <span>
                <span>
                    {this.CardsAreThere(this.props.G)}
                </span>
                <br></br>
                <Timer/>
                <br/>
                <br></br>
                <span>
                    TablePot :  {this.props.G.potOnTable}
                    <br/>
                    To Bet : {this.props.G.currentBetAmount}
                </span>
              </span>
              
            </div>);
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
                    </div>
                )
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
