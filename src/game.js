import {TurnOrder} from "boardgame.io/core";
import {PlayerView} from "boardgame.io/core";
import {exportedOne} from './hands.js'

// add winning conditions
// get who are the winners on the end of last round if number of players are more than 2
// if non folded and non busted are > 2. then give winning conditon
//  if non folded and non busted is 1, then make that person winner and give pot to him
// Also if all are in allin condititon , then reveal the cards
// say among 3 players 2 are in all in and then we have to reveal the cards
// 



export const pokerGame = {
    name:'poker-game',
    
    setup: (setupData) => ({ playerPots: new Array(6).fill(500),
        
        smallBlind: 5,
        bigBlind: 10,
        dealerId: 0,
        smallBlindPlayerId:0,
        bigBlindPlayerId:0,
        whoStartsTheRound: 0,
        whoStartsNextPhase: 0,
        canBreak: false,
        blindsNotDealtYet: true,
        playerFoldedStatus: new Array(getNumPlayers()).fill(0),
        playerInGameStatus: new Array(getNumPlayers()).fill(1),
        cards : make_deck(),
        boardCards:[],
        numberOfPlayers: setupData.numPlayers,
        setupData:setupData,
        deckIndex:0,
        
        // this players object is special one. This will be reduced incase we have playerview
        // it will only show only each player only their key value.
        players:{
                    0: {'carda':"",'cardb':""},
                    1: {'carda':"",'cardb':""},
                    2: {'carda':"",'cardb':""},
                    3: {'carda':"",'cardb':""},
                    4: {'carda':"",'cardb':""},
                    5: {'carda':"",'cardb':""},
                },
        playerObjs: make_players(),
        potOnTable: 0,
        currentBettorIndex:0,
        currentBetAmount:0,
        currentRaiseAmount:0,
        canEndcurrentPhase:false,

        // for handling end of round
        global_pot_remainder:0,




    }),

    playerView: PlayerView.STRIP_SECRETS,
    // moves: {
    //     move: G => G,
    //     BetThisMuchAmount,
    // },

    phases: {
        PreFlop: {
            onBegin: (G, ctx)=> {
                // Shuffling cards
                // will reset deck index and creates new deck from the cards after
                //  shuffling them randomly
                shuffle(G);

                // Adding players status to be set in GAME
                console.log("Preflop phase has started");
                for (let [playerIndex, playerObj] of Object.entries(G.playerObjs)) {
                    console.log(playerIndex, playerObj.name);
                    playerObj.status="INGAME";
                };
                // Object.entries(G.playerObjs)
                // console.log(Object.entries(G.playerObjs));

                // clearing bets at the start of the game
                clearBets(G,ctx);

            

                // Clearing player cards
                clearPlayerCards(G,ctx);

                // clear board cards
                G.boardCards = [];
                console.log("Board cards are reset to nothing here "+G.boardCards);


                // Adding cards to players
                addPlayerCards(G,ctx);

                // calling blinds and deal
                callBlindsAndDeal(G,ctx);

                


            },
            moves: { 
                        handleBet ,
                        handleCall,
                        FoldThisPlayer,
                    },
            
            turn:{
                order: {
                    first: (G,ctx) => G.whoStartsTheRound,
                    // next: (G, ctx) => (ctx.playOrderPos + 1) % ctx.numPlayers,
                    next:(G,ctx)=>getNextPlayerWhoIsPlaying(G,ctx),
                },
            },
            
            // endIf: G => G.potOnTable <= 0,
            next: 'Flop',
            start: true,
            endIf: (G,ctx)=>checkIfPhaseEnds(G,ctx),
            onEnd: (G,ctx)=>{
                // calling functions that are activated at the end of the phase
                console.log("Ending Preflop phase")

                // calling the cards on the board (3 cards that are needed)
                addFlopCards(G,ctx);

                // adding the total bet of each player to the subtotal value
                addSubBetsToTotal(G,ctx)
                // newFunction(G);

                // clearing the subtotal_bets for this phase which is preflop, besure to 
                // add the subtotalbets to the totalbets before clearing them out.
                clearBets(G,ctx);

                // Setting the current minimum raise amount to Bigblind
                G.currentRaiseAmount = G.bigBlind;

                // clearing the player statuses who are not folded or 
                clearNonBustFoldPlayerStatus(G,ctx);


                // Set the last player in the round to be having the status as option
                // so as to not skip the phase 
                setOptionPlayer(G,ctx);

                // pass on the value of who should start the next phase turn 
                // generally we have to start with small blind player if he is still playing
                // if the person is not there then start the immediate next one
                //  if the players are less than 2 then round has ended though and this 
                //  can return undefined
                whoStartsNextPhase(G,ctx);
                

            }
        },


        Flop: {
            onBegin: (G,ctx)=>{
                console.log("Flop phase has started");

                // setting the playorderpos to the small blind person
            },
            moves: { 
                    handleBet,
                    handleCall,
                    FoldThisPlayer, 
                },

            turn:{
                order: {
                    first: (G,ctx) => G.whoStartsNextPhase,
                    // next: (G, ctx) => (ctx.playOrderPos + 1) % ctx.numPlayers,
                    next:(G,ctx)=>getNextPlayerWhoIsPlaying(G,ctx),
                },
            },
                
                
            endIf: (G,ctx)=>checkIfPhaseEnds(G,ctx),
            next: 'TTurn',

            onEnd: (G,ctx)=>{

                console.log("Ending FLop phase");
                
                // doing some of the things that we have done in last phase

                // Adding card to the board
                addCardToBoard(G,ctx);

                // add the total bets with subtotal ones
                addSubBetsToTotal(G,ctx);

                // clear bets
                clearBets(G,ctx);

                // setting the big blind to current raise amount
                G.currentRaiseAmount = G.bigBlind;

                // clear non bust folded player statuses
                clearNonBustFoldPlayerStatus(G,ctx);

                // setting the option player for next phase
                setOptionPlayer(G,ctx);

                // computing who starts the next phase
                whoStartsNextPhase(G,ctx);

            }
        },

        TTurn:{
            onBegin: (G,ctx)=>{
                console.log("LastTurn phase has started");

            },
            moves: { 
                handleBet,
                handleCall,
                FoldThisPlayer, 
            },

            turn:{
                order:{
                    first: (G,ctx)=> G.whoStartsNextPhase,
                    next: (G,ctx) => getNextPlayerWhoIsPlaying(G,ctx),
                },
            },

            endIf: (G,ctx)=> checkIfPhaseEnds(G,ctx),

            next: 'River',

            onEnd: (G,ctx)=>{
                console.log("Ending Last Turn Phase");

                // Adding card to the board
                addCardToBoard(G,ctx);

                // add the total bets with subtotal ones
                addSubBetsToTotal(G,ctx);

                // clear bets
                clearBets(G,ctx);

                // setting the big blind to current raise amount
                G.currentRaiseAmount = G.bigBlind;

                // clear non bust folded player statuses
                clearNonBustFoldPlayerStatus(G,ctx);

                // setting the option player for next phase
                setOptionPlayer(G,ctx);

                // computing who starts the next phase
                whoStartsNextPhase(G,ctx);

                // // DELETE THIS #######AFTER 
                // convertPlayersToSend(G,ctx);

                // // DELETE THIS #######AFTER
                // calculateWinners(G,ctx);
            }

        },

        River:{
            onBegin: (G,ctx)=>{
                console.log("River phase has started");

            },
            moves: { 
                handleBet,
                handleCall,
                FoldThisPlayer, 
            },

            turn:{
                order:{
                    first: (G,ctx)=> G.whoStartsNextPhase,
                    next: (G,ctx) => getNextPlayerWhoIsPlaying(G,ctx),
                },
            },

            endIf: (G,ctx)=> checkIfPhaseEnds(G,ctx),
            next: 'PreFlop',

            onEnd:(G,ctx)=> {
                console.log(`Ending the River phase ,\n 
                Tasks to do- Delcare Winner \n 
                Show his cards \n 
                Tell which hand he won with \n 
                Decide if multiple winners and display them as well \n 
                Reset Current Raise amount to Bigblind \n 
                Check if the blinds are dealt with new player \n
                Modify if any new players are in queue to Join the game
                        `);
                executeOrder66(G,ctx);

                // Changing the blindsNotDealtYet to true because we are going to new PreFlop phase here
                G.blindsNotDealtYet = true;

                // Clearing the pot of the board
                clearPot(G,ctx);

                // Setting Current Raise amount to 0, Just checking whether this will work
                G.currentRaiseAmount = 0;
            }

        }

    },

    

    turn: { moveLimit:1},

    events: {
        endPhase: false,
    },

};

function addSubBetsToTotal(G,ctx) {
    // using best practice like i said
    // adding all the subtotal bets for this phase to the total bets of all the players.
    Object.keys(G.playerObjs).map(
        key => {
            G.playerObjs[key].total_bet += Number(G.playerObjs[key].subtotal_bet);
        }
    )
}

function whoStartsNextPhase(G,ctx){
    console.log("Computing who should start the next phase");
    const currentSmall = G.smallBlindPlayerId;

    let activePlayersIds = getAllActivePlayers(G,ctx);
    const PlayerIds = activePlayersIds.map(x=>x*1).sort(function(a, b){return a - b});

    // find if the small blind player is active or not
    // let activePlayers = getAllActivePlayers(G,ctx).map(x=>x*1).sort(functionn(a,b){
    //     return a-b;
    // });
    // let sortedPlayers = 
    let nextOneIndex = PlayerIds.findIndex(x=> x>currentSmall);

    // if the small player is active player then he will start the next phase 
    if(PlayerIds.includes(currentSmall)){
        G.whoStartsNextPhase = currentSmall;
        // return G.whoStartsNextPhase;
    } else if (nextOneIndex !== -1){
        G.whoStartsNextPhase = PlayerIds[nextOneIndex]
    } else {
        nextOneIndex = 0
        G.whoStartsNextPhase = PlayerIds[nextOneIndex];
    }

    // Return modified G.whoStartsNextPhase
    return G.whoStartsNextPhase;

}


function checkIfPhaseEnds(G,ctx){
    // console.log("THIS phase is ending")
    // G.canBreak = true;

    // If these condtions are satisfied even if one then we cannot break the phase
    //  the condtions are if anyone status is option
    //                 or if anyone who is not busted or folded 
    //                      has money and his subotalbet is less than CurrentBetamount
    //  If all the conditions are false, then we can skip the phase
    // so for each player we create condtion and then if all are false then we skip the phase.

    //  --------
    let i = 0
    let conditionArray = [];

    do{
        let status = G.playerObjs[i]["status"];
        let condition = status === "option" || 
                       (status !== "bust" && 
                        status !== "fold" && 
                        G.playerObjs[i]["bankroll"]>0.01 && 
                        G.playerObjs[i]["subtotal_bet"]<G.currentBetAmount)
                        || G.blindsNotDealtYet
        let condition2 = status === "option" || (status !== "bust" && 
                                                 status !== "fold" &&
                                                 G.playerObjs[i]["bankroll"]>0.01 &&
                                                 G.playerObjs[i]["subtotal_bet"]>0.01)
        conditionArray.push(condition);
        i = i+1;
    }
    while(i<getNumPlayers());
    console.log("condition array is "+conditionArray)

    // Only if all the conditions for every player is false then we end the phase by 
    //  returning true.
    let toExit = conditionArray.every(v=> v===false);
    console.log("Should we exit now "+toExit);
    return toExit;

    // --------
    // let status = G.playerObjs["0"]["status"];
    // let condition = (status === "option" || (status !== "bust" && status !== "fold" 
    //                                         && G.playerObjs["0"]["bankroll"]>0.01
    //                                         && G.playerObjs["0"]["subtotal_bet"]<=G.currentBetAmount))
    //                 && G.blindsDealt
    // console.log("condition is "+condition);
    // return condition;
    // return G.canBreak;
}

function setOptionPlayer(G,ctx){
    console.log("setting option to  who is before the small blind in round robin fashion");
    const currentSmall = G.smallBlindPlayerId;
    
    let activePlayersIds = getAllActivePlayers(G,ctx);
    const PlayerIds = activePlayersIds.map(x=>x*1).sort(function(a, b){return a - b});

    // find the player who is previous to the small blind player. 
    //  loop until and find the first one who is non folded, or busted or allin
    let smallBlindIndex = PlayerIds.findIndex(x => x==currentSmall);
    let optionPlayerId = 0;
    let optionPlayerIndex = 0;
    // if smallblindindex is found. 
    if(smallBlindIndex !== -1){
        optionPlayerIndex = smallBlindIndex - 1;
        if(smallBlindIndex === 0){
            // if the 0th guy is the smallblind
            optionPlayerIndex = PlayerIds.length - 1;
        }
    }
    // if the smallblindindex is not found then.
    else{
        // finding the nexthighest playerindex in playerids who is just greater than
        //  smallblind index
        let nextHighestToSmall = PlayerIds.findIndex(x => x>currentSmall);
        // if the index is not found or if it is the first element of PlayerIds
        // then the optionplayerid needs to be set to the last player
        if(nextHighestToSmall === -1 || nextHighestToSmall === 0){
            // if the index is not found means the small is highest index and he is folded
            // which makes the current last one in PlayerIds to be option player
            optionPlayerIndex = PlayerIds.length-1;
        
        } else {
            // if the nextHighestToSmall is found and it is not first element or undefined
            // then we need to subtract 1 position from this and set this to optionplayerindex
            // . Logic behind this is that say we have 1,2,3,4 and 3 is small and folded in next
            //  left with 1,2,4 now next highest to small is 4 and when we subtract 1 index 
            //  we have option player as 2. and this is what is true since 3 is small and 4 is big
            //  the round starts with big anyways
            optionPlayerIndex = nextHighestToSmall-1;
        }
        
    }

    // setting the required changes 
    optionPlayerId = PlayerIds[optionPlayerIndex];
    // setting the status of the person who is last in queue of the sorted players list.
    // this will make the endphase function to return false and says not to exit the phase

    G.playerObjs[optionPlayerId]["status"] = "option";

}

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
    // setting the cards variable in G, to new deck that is made
    G.cards = make_deck();

    // shuffling process
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
    new_shuffle(G);
    // Resetting deckindex so that we can deal on this
    G.deckIndex = 0;
}


function make_players() {
    let numplayers = getNumPlayers();
    let playerObjs = {};
    let names = ["Adam","Eve","Jesus","Moses","Yehova","Satan"]
    for (let i = 0; i < numplayers; i++) {
        // bankroll : player pot
        // carda, cardb are the cards given
        // status can be FOLD, ALLIN, CALL, RAISE, INGAME, BUST
        // total_bet is the total bet in a round ( Starting from preflop to river)
        // subtotal_bet is the bet for each phase, will reset after phase
        playerObjs[i] = {
            "name":names[i],
            "bankroll":500,
            "carda":"",
            "cardb":"",
            "status":"",
            "total_bet":0,
            "subtotal_bet":0,
        }
    }
    return playerObjs;

}

function clearPlayerCards(G, ctx) {
    console.log("Clearing player cards");
    console.log("Player keys are "+Object.keys(G.playerObjs));

    // Explained version
    // let playerKeys = Object.keys(G.playerObjs);
    // playerKeys.map(key=>{
    //     let playerObj = G.playerObjs[key];
    //     playerObj["carda"] = "changed";
    // });
    // Compact version below

    Object.keys(G.playerObjs).map(
        key =>{
            G.playerObjs[key]["carda"]="";
            G.playerObjs[key]["cardb"]="";
            G.players[key]["carda"]="";
            G.players[key]["cardb"] = "";
        }
    )
}

function clearPot(G,ctx){
    console.log("clearing the pot of the game");
    Object.keys(G.playerObjs).map(
        key=>{
            G.playerObjs[key].total_bet = 0;
        }
    )
}


function clearBets(G,ctx){
    console.log("calling ClearBets , maybe jumping to next phase");
    Object.keys(G.playerObjs).map(
        key=>{
            G.playerObjs[key]["subtotal_bet"] = 0;
        }
    )

    // BEST PRACTICE IS TO AVOID THIS. This doesn't seem to be working probably
    //  because the keys needs to be string but instead they are numbers . 
    // for(var i=0;i<G.playerObjs.length;i++){
    //     G.playerObjs[i]["subtotal_bet"] = 0;
    //     console.log(G.playerObjs[i]["subtotal_bet"]);
    // }
    // Setting the current Bet amount to be 0, since we are past the phase
    G.currentBetAmount = 0;
}


function addPlayerCards(G,ctx){
    console.log("Adding cards to the players in the playerObjs");

    // loop through all the players and add 2 cards from the cards
    var players = getPlayersWithMoney(G);

    // map with each player in the players array and then set that index player
    // key to 
    players.forEach(
        el=>{
            G.players[el]["carda"] = G.cards[G.deckIndex];
            G.deckIndex = G.deckIndex +1;
            G.players[el]["cardb"] = G.cards[G.deckIndex];
            G.deckIndex = G.deckIndex + 1;
        }
    )

}



function clearPlayerStatuses(G,ctx,playerId){
    if(playerId !== null){
        G.playerObjs[playerId]['status']="";
    } else{
        Object.keys(G.playerObjs).map(
            key=>{
                G.playerObjs[key]['status']="";
            }
        )
    }

}


// Reset the status of all the players who are not busted or folded
//  if these players are like this then their status is getting modified to nothing.
function clearNonBustFoldPlayerStatus(G,ctx){
    Object.keys(G.playerObjs).map(
        key=>{
            const status = G.playerObjs[key].status
            if(status !== "fold" && status !== "bust"){
                G.playerObjs[key].status = "";
            }
        }
    )

    // AS TOLD before best practice is to avoid this.

    // for (let index = 0; index < G.playerObjs.length; index++) {
    //     const status = G.playerObjs[index]["status"];
    //     if(status !== "fold" && status !== "bust"){
    //         G.playerObjs[index]["status"] = "";
    //     }
    // }
}



// Gets all the active players first (who are not folded , busted or allin). Then
// iterates through thte sorted activeplayers and increments the currentplayerindex
// in this sorted players. This will return playerid of the person who should play next

function getNextPlayerWhoIsPlaying(G,ctx){
    let activePlayersIds = getAllActivePlayers(G,ctx);
    const PlayerIds = activePlayersIds.map(x=>x*1).sort(function(a, b){return a - b});
    let currentPlayerId = ctx.currentPlayer*1;

    // finding index of currentplayer in the playerids array
    let currentPlayerIndex = PlayerIds.findIndex(x => x==currentPlayerId);
    let nextPlayer = null;
    let nextPlayerIndex = null;
    console.log("currentplayerid is "+currentPlayerId);
    console.log("currentplayerindex is "+currentPlayerIndex);
    // say playerids [0,2,5], currentindex is 2 and current player is 5
    // nextplayer index is 3, and length of playeridsis 3, then it should be playerid[0]    

    if (PlayerIds != null){
        console.log("playerids are not null and calling getnextplayerwhoisplaying");
        console.log("playerids are "+ PlayerIds)
        if(PlayerIds.length > 1){
            // if the currentplayerindex is found in the playerids list
            if(currentPlayerIndex !== -1){
                nextPlayerIndex = currentPlayerIndex+1;
                if(nextPlayerIndex == PlayerIds.length){
                    nextPlayer = PlayerIds[0];
                }else{
                    nextPlayer = PlayerIds[nextPlayerIndex];
                }
                console.log("returing nextplayer who is "+nextPlayer);
                return nextPlayer; 
            } else{
                currentPlayerIndex = PlayerIds.findIndex(x => x>currentPlayerId);
                // if this is found then ok, if currentplayerindex is not found here as well, then
                //  that means say we have 1,2,3,4,5 and currently 5 has folded. current plyaer is still 5
                //  and we cant find it in playerids since he is folded we have 1,2,3,4
                nextPlayerIndex = currentPlayerIndex !== -1 ? currentPlayerIndex:0;
                nextPlayer = PlayerIds[nextPlayerIndex];
                return nextPlayer;
            }
             
            

        } else if (PlayerIds.length == 1){
            return undefined;
        }
    } else if (PlayerIds == null){
        console.log("NULLPLAYERIDS and calling getnextplayerwhoisplaying");
        return undefined;
    }
    
    // return 3;


}

function EndThisCurrentPhase(G, ctx) {
    ctx.events.endPhase();
}


function BetThisMuchAmount(G, ctx, amount){
    console.log("Move BetThisMuchAmount has been called");
    G.potOnTable = G.potOnTable+Number(amount);
    G.playerObjs[ctx.currentPlayer]["bankroll"] = G.playerObjs[ctx.currentPlayer]["bankroll"]-Number(amount);
    G.playerObjs[ctx.currentPlayer]["subtotal_bet"] += Number(amount);
    // ctx.events.endTurn({next:(G, ctx) => (ctx.playOrderPos + 1) % ctx.numPlayers})
    ctx.events.endTurn();
}

function FoldThisPlayer(G,ctx){
    console.log("Folding this player ");
    // updating currentplayer who pressed this button status to fold
    G.playerObjs[ctx.currentPlayer]["status"]="fold";
    ctx.events.endTurn();
}

function handleCall(G,ctx){
    console.log("Calling Call function");
    G.playerObjs[ctx.currentPlayer]["status"] = "call";
    var amountToCall = G.currentBetAmount - G.playerObjs[ctx.currentPlayer]["subtotal_bet"];
    console.log("amountToCall is "+amountToCall);
    theBettingFunction(G,ctx,ctx.currentPlayer,amountToCall);
    ctx.events.endTurn();
}

function handleBet(G,ctx,amountToBet){
    console.log("Calling Bet function");
    if(amountToBet<0 || isNaN(amountToBet)){
        amountToBet = 0;
    }
    var amountToCall =  G.currentBetAmount - G.playerObjs[ctx.currentPlayer]["subtotal_bet"];
    amountToCall += Number(amountToBet);
    console.log("amountToCall is "+amountToCall+" amountToBet is "+amountToBet);
    var isOkBet = theBettingFunction(G,ctx, ctx.currentPlayer, amountToCall);

    if (isOkBet){
        G.playerObjs[ctx.currentPlayer]["status"]="call";
        ctx.events.endTurn();
    }
}

function callBlindsAndDeal(G,ctx){
    console.log("Calling blinds from small blind and bigblind");
    var smallBlind = G.smallBlind;
    var bigBlind = G.bigBlind;
    var numPlayingWithMoney = getPlayersWithMoney(G).length;
    var lastDealerPosition = G.dealerId
    // Calling thebet function and making this smallblind player deal small blind amount
    // say 0,1,3,4,5 and last dealer is 4. 5 being small, 0 being big and next round its 3,4,5 left
    //  0,1 left --> dealer is 5, 5> len(playerids) then its plaeyrids[0]  
    // take dealerplayerid and find its index in currentplayerswithmoney sorted
    // then if that dealer player id is found -> do all the steps 
    //  if it is not found, find the immediate next big playerid in sorted
    // if nextbig is there then -> do all the steps
    //  if next big is nto found and you are the biggest , then find the first element of the 
    //  currentplayerswithmoney sorted and then -> do all the steps
    //  take dealerplayerid and find the next big value in the playerids and return its index
    //  --> it is new dealerplayerid and follows the small and big
    //  if the nextbigvalue is not present then first value of the playerids is the newdealer
    

    function nextOneIfCrosses(elindex, arr){
        let output = elindex>=arr.length-1 ? 0: elindex+1
        return output
    }

    if(getAllActivePlayers(G,ctx).length>1){
        //  getting players with money and then sorting the players and then finding the 
        //      index of the dealer with dealerid
        //  0,1,2,3,4,5 --> 3,4,5
        let nonBustPlayers = getPlayersWithMoney(G)
        const playerIds = nonBustPlayers.map(x=>x*1).sort(function(a, b){return a - b});
        let newdealerIndex = playerIds.findIndex(x=>x>G.dealerId);
        if(newdealerIndex !== -1){
            newdealerIndex = newdealerIndex;
        }else{
            newdealerIndex = 0;
        }

        console.log("new dealer is found and the new dealer is "+playerIds[newdealerIndex]);
        // let newdealerIndex = nextOneIfCrosses(dealerIndex, playerIds);
        let smallBlindIndex = nextOneIfCrosses(newdealerIndex, playerIds);
        let bigBlindIndex = nextOneIfCrosses(smallBlindIndex, playerIds);
        let nextOneIndex = nextOneIfCrosses(bigBlindIndex, playerIds);

        // Updating the smallblind and bigblind player ids in the game object
        G.smallBlindPlayerId = playerIds[smallBlindIndex];
        G.bigBlindPlayerId = playerIds[bigBlindIndex];

        // Calling smallblind from the smallblindplayer and ending his turn
        // if(ctx.currentPlayer === playerIds[smallBlindIndex]){

        // }
        //  trying something new
        ctx.events.endTurn({next:playerIds[smallBlindIndex]})
        var issmallok = theBettingFunction(G,ctx,playerIds[smallBlindIndex],smallBlind);
        if(issmallok){ 
            console.log("Ending turn");
            console.log("current player is "+ctx.currentPlayer);
            ctx.events.endTurn({next:playerIds[bigBlindIndex]});
            console.log("currentplayer after ending turn is "+ctx.currentPlayer);
        }
        var isbigok = theBettingFunction(G,ctx,playerIds[bigBlindIndex],bigBlind);
        if(isbigok){ 
            // set the bigblind player status to option
            G.playerObjs[playerIds[bigBlindIndex]]["status"] = "option";
            ctx.events.endTurn({next:playerIds[nextOneIndex]});

        }

        // updating the new dealer id after calling the blinds.
        G.dealerId = playerIds[newdealerIndex];

        // updating who should start the round after calling the blinds
        G.whoStartsTheRound = playerIds[nextOneIndex];

        // ---> REMOVE THIS WHEN NOT NEEDED
        // G.canBreak = true;

        // Change the blindsdealt boolean
        G.blindsNotDealtYet = false;

        
    

    }else{
        console.log("Cant call blinds and deal since activeplayers are less than 1")
        return 0;
    }

}


function addFlopCards(G,ctx){
    // add 3 cards to G.boardCards array 
    console.log("Adding flop cards")
    for (let index = 0; index < 3; index++) {
        G.boardCards.push(G.cards[G.deckIndex])
        G.deckIndex = G.deckIndex+1;
    }

}

function addCardToBoard(G,ctx){
    console.log("Adding turn card");
    G.boardCards.push(G.cards[G.deckIndex])
    G.deckIndex = G.deckIndex + 1;
}


function getPlayersWithMoney(G){
 
    let players = G.playerObjs
    let nonBust = Object.entries(players).filter(e=>{
        return e[1]["bankroll"]>0
    });
    nonBust = Object.fromEntries(nonBust);
    // returns player ids
    return Object.keys(nonBust);

}


function CallCurrentBetAmount(G,ctx){
    console.log("Calling current amount");
    if (G.playerObjs[ctx.currentPlayer]["status"]=="fold" || G.playerObjs[ctx.currentPlayer]["status"]=="bust"){
        ctx.events.endTurn();
    }
    if(G.playerObjs[ctx.currentPlayer]["bankroll"] <= G.currentBetAmount){
        G.playerObjs[ctx.currentPlayer]["status"] = "allin";
        BetThisMuchAmount(G,ctx,G.currentBetAmount);
    } else {
        G.playerObjs[ctx.currentPlayer]["status"]="call";
        BetThisMuchAmount(G,ctx,G.currentBetAmount);

    }
}


function CallSmallBlind(G,ctx){
    console.log("Calling smallBlind amount from small blind ");
    // getting the active players sorted out.
    let activePlayersIds = getAllActivePlayers(G,ctx);
    const PlayerIds = activePlayersIds.map(x=>x*1).sort(function(a, b){return a - b});
    
    if(PlayerIds.length<2){
        return null;
    }else{
        let currentDealer = G.dealerId;
        var smallBlindPlayerId = currentDealer+1;

    }


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



// functions invovling in the phases

// gets all the playerids who are  active and currently playing
// Eliminating all the players who are folded and also out of money(busted)
//  Also eliminating the players who are ALL IN.
function getAllActivePlayers(G, ctx){
    let players = G.playerObjs;
    let nonFolded = Object.entries(players).filter(e=>{
        return e[1]["status"] !== "fold" && e[1]["status"] !=="bust" && e[1]["bankroll"]>= 0.01
    })
    nonFolded = Object.fromEntries(nonFolded);
    // returning the Ids of players who are not folded or busted
    return Object.keys(nonFolded);
}


function getPotSize(G){
    var amount = 0;
    for (var i = 0 ; i < getNumPlayers(); i++){
        amount = amount + G.playerObjs[i]["total_bet"] + G.playerObjs[i]["subtotal_bet"];
        console.log(amount);
    }
    // console.log("Pot size is "+amount);
    return amount;
}


function theBettingFunction(G,ctx,playerId,betAmount){
    //  Returns 1 if some addition is being done or being checked
    //  Returns 0 if illegal conditions are satisfied or moves are made.
    // If the player is fold, then return 0
    if(G.playerObjs[playerId]["status"]=="fold"){
        return 0;
    
    // If the betAmout is greater than the bankroll that he has he goes all IN
    // and currentBetAmount is updated if the  sum of betAmount and currentplayer
    // subtotalbet is greater that it is.
    } else if(betAmount >= G.playerObjs[playerId]["bankroll"]) {
        betAmount = G.playerObjs[playerId]["bankroll"];

        let oldCurrentBet = G.currentBetAmount;

        // If a person with huge pot goes all in , current bet amount has to be updated
        if(betAmount + G.playerObjs[playerId]["subtotal_bet"] > G.currentBetAmount){
            G.currentBetAmount = G.playerObjs[playerId]["subtotal_bet"] + Number(betAmount);
        }

        var newCurrentMinRaise = G.currentBetAmount-oldCurrentBet;

        // if the minimum raise is higher than the previous one, then update it.
        if(newCurrentMinRaise>G.currentRaiseAmount){
            G.currentRaiseAmount = newCurrentMinRaise;

        }
        G.playerObjs[playerId]["status"] = "call";
    } 
    // This function will be the actual calling or can be acted as checking function too.
    else if (betAmount + G.playerObjs[playerId]["subtotal_bet"] == G.currentBetAmount){
        //  This can be also used as check function by keeping the betAmount as 0
        G.playerObjs[playerId]["status"] = "call";

    }
    // This is being careful, HOWever make sure this case is not called.
    // This will occur for example if the player somehow managed to bet amount that is less that
    //  that is required. For example a player has subtotal bet of 100 and current betamount
    //  is 120, it needs to be made sure that player cannot bet with amount of 10 as betamount

    else if (betAmount + G.playerObjs[playerId]["subtotal_bet"] < G.currentBetAmount){
        alert("The current betamount is "+G.currentBetAmount+" You must bet atleast of "+
        (G.currentBetAmount - G.playerObjs[playerId]["subtotal_bet"])+ " or fold");
        return 0;
    }

    // Another case is where the player is betting amount like 5, when the minimum raise is 
    //  like 10. Also minimum raise is reset the moment someone raises , so it can be used
    //  in raising function as well.
    else if (betAmount + G.playerObjs[playerId]["subtotal_bet"] > G.currentBetAmount &&
             getPotSize(G) > 0 &&
             betAmount + G.playerObjs[playerId]["subtotal_bet"] - G.currentBetAmount < 
                G.currentRaiseAmount
             ){
        alert("Current minimum raise is currently "+ G.currentRaiseAmount);
        alert("betAmount is "+betAmount);
        alert("subtotal bet is "+G.playerObjs[playerId].subtotal_bet);
        alert("current bet amount is "+G.currentBetAmount);
        alert(betAmount+G.playerObjs[playerId].subtotal_bet > G.currentBetAmount);
        return 0;

    } 
    //  Raise case finally if the amount bet is raising
    else {
        console.log("IN THE LAST ELSE");
        let oldCurrentBet = G.currentBetAmount;
        G.currentBetAmount = G.playerObjs[playerId]["subtotal_bet"] + Number(betAmount);
        console.log("Current bet amount is in the last ELSE is "+G.currentBetAmount);

        if (getPotSize(G)>0){
            var newCurrentMinRaise = G.currentBetAmount - oldCurrentBet
            if (newCurrentMinRaise > G.currentRaiseAmount){
                G.currentRaiseAmount = newCurrentMinRaise;
            }
            if (G.currentRaiseAmount < G.bigBlind){
                G.currentRaiseAmount = G.bigBlind;
            }
        }
    }

    //  Doing the operations on the subtotal_bet amount and the bankroll
    G.playerObjs[playerId]["subtotal_bet"] =G.playerObjs[playerId]["subtotal_bet"]+Number(betAmount);
    G.playerObjs[playerId]["bankroll"] -= Number(betAmount);

    // Updating pot size in the last 
    G.potOnTable = getPotSize(G);
    console.log("Pot on table is "+G.potOnTable);
    return 1;
}



function convertPlayersToSend(G,ctx,peopletosend){
    // takes the players object which is defined in the game object and then 
    // process them so that it can be matched with the get_winners helper function that we have in the poker.js

    // Requirements -> Each player who is not foled or busted are first selected. Then
    // select the keys of those players and then form a function which can convert them to the things that we want

    // keys of active people
    // let activePeople = getAllActivePlayers(G,ctx);

    function makePlayerObject(playerid, carda, cardb){
        this.playerid = playerid;
        this.carda = carda;
        this.cardb = cardb;
    }

    var my_players = [];

    // for (let index = 0; index < Object.entries; index++) {
    //     if(!peopletosend[index]){
    //         continue;
    //     }
    //     let playerid = activePeople[index];
    //     let carda = G.players[playerid].carda;
    //     let cardb = G.players[playerid].cardb;
    //     my_players.push(new makePlayerObject(playerid, carda, cardb))
    // }

    // Using best method
    Object.keys(G.playerObjs).sort(function(a,b){return a-b}).map(
        key=>{
            if(!peopletosend[key]){
                my_players.push(null);
            } else{
                my_players.push(new makePlayerObject(
                    key*1,G.players[key].carda, G.players[key].cardb 
                ))
            }
        }
    )


    // converted all the players to the format we want, now we need to see whether this matches 
    console.log("my_players here are as follows");
    console.log(my_players);
    return my_players;
}

function calculateWinners(G,ctx,peopletosend){
    console.log("calculating winners")
    var toSend = convertPlayersToSend(G,ctx,peopletosend);
    var boardis = G.boardCards;
    var winnersare = exportedOne(toSend,boardis);
    console.log("winners are ");
    console.log(winnersare);
    return winnersare;

}

function executeOrder66(G,ctx){
    // This function will distribute the pot to the winners of the gam
    // Dont call it until all five cards are open.
    var players = Object.values(G.playerObjs);
    var candidates = new Array(players.length);
    var allocations = new Array(players.length);
    var winning_hands = new Array(players.length);
    var my_total_bets_per_player = new Array(players.length);

    // clearing ones that are folded or busted
    var still_active_candidates = 0;
    var activeOnesKeys = getAllActivePlayers(G,ctx).map(x=>x*1).sort(function(a,b){return a-b});
    for (let index = 0; index < candidates.length; index++) {
        simplefunc1(index);
    }

    function simplefunc1(i) {
        allocations[i] = 0;
        my_total_bets_per_player[i] = players[i].total_bet;
        if (activeOnesKeys.includes(i)) {
            candidates[i] = players[i];
            still_active_candidates += 1;
        }
    }

    var my_total_pot_size = getPotSize(G);
    var my_best_hand_name = "";
    var best_hand_players;
    var current_pot_to_split = 0;
    var pot_remainder = 0;

    if(G.global_pot_remainder){
        pot_remainder = G.global_pot_remainder;
        my_total_pot_size += Number(G.global_pot_remainder);
        G.global_pot_remainder = 0;
    }
    
    while(my_total_pot_size > (pot_remainder + 0.9) && still_active_candidates){
        
        var winners = calculateWinners(G,ctx,candidates);

        if(!best_hand_players){
            best_hand_players = winners;
        }

        if(!winners){
            pot_remainder = my_total_pot_size;
            my_total_pot_size = 0;
            break;
        }

        var lowest_winner_bet = my_total_pot_size*2;
        var num_winners = 0;

        // getting the lowest winner bet
        for (let index = 0; index < winners.length; index++) {
            // const element = winners[index];
            if(!winners[index]){
                continue;
            }            

            if(!my_best_hand_name){
                my_best_hand_name = winners[index]["hand_name"];
            }
            num_winners++;
            if(my_total_bets_per_player[index] < lowest_winner_bet){
                lowest_winner_bet = my_total_bets_per_player[index];
            }
        }

        // dealing with the lowest pot and adding that to currentpottosplit
        // and then deleting that amount from the lowestpot in mytotalbets
        current_pot_to_split = pot_remainder;
        pot_remainder = 0;

        for (let index = 0; index < players.length; index++) {
            // const element = players[index];
            if(lowest_winner_bet >= my_total_bets_per_player[index]){
                current_pot_to_split += my_total_bets_per_player[index];
                my_total_bets_per_player[index] = 0;
            }else{
                current_pot_to_split += lowest_winner_bet;
                my_total_bets_per_player[index] -= lowest_winner_bet;
            }
            
        }

        // Calculating the share that needs to be given
        var share = Math.floor(current_pot_to_split/num_winners);
        pot_remainder = current_pot_to_split - share*num_winners;

        // Go through winners and then for each winner
        // if the bet of this guy is < 0.01 then make that candidate index as null
        // if winner is null go to next guy hover over loop
        // then add that share to the players allocation[index] and remove
        // that from mytotalpotshare
        for (let index = 0; index < winners.length; index++) {
            // const element = candidates[index];
            if(my_total_bets_per_player[index]<0.01){
                candidates[index] = null;
            }
            if(!winners[index]){
                continue;
            }
            my_total_pot_size -= Number(share);
            allocations[index] += Number(share);
            winning_hands[index] = winners[index].hand_name;
        }

        // Iterate until the pot size is zero or no more candidates
        for (let index = 0; index < candidates.length; index++) {
            // const element = candidates[index];
            if(candidates[index] == null){
                continue;
            }
            still_active_candidates += 1
        }

        if(still_active_candidates == 0){
            pot_remainder = my_total_pot_size;
        }
    } // End of pot distribution

    G.global_pot_remainder = pot_remainder;
    pot_remainder = 0;

    // Distributing the pot here
    for (let index = 0; index < allocations.length; index++) {
        // const element = allocations[index];
        if(allocations[index] > 0){
            players[index].bankroll += Number(allocations[index]);

        } else{
            if(G.playerObjs[index].bankroll <= 0.01 
                && G.playerObjs[index].status !== "bust"){
                    G.playerObjs[index].status = "bust";
                }
        }
    }
}



// function handle_end_of_round (G,ctx) {
//     var players = Object.values(G.playerObjs);
//     var candidates = new Array(players.length);
//     var allocations = new Array(players.length);
//     var winning_hands = new Array(players.length);
//     var my_total_bets_per_player = new Array(players.length);
  
//     // Clear the ones that folded or are busted
//     var i;
//     var still_active_candidates = 0;
//     for (i = 0; i < candidates.length; i++) {
//       allocations[i] = 0;
//       my_total_bets_per_player[i] = players[i].total_bet;
//       if (players[i].status != "FOLD" && players[i].status != "BUST") {
//         candidates[i] = players[i];
//         still_active_candidates += 1;
//       }
//     }
  
//     var my_total_pot_size = getPotSize(G);
//     var my_best_hand_name = "";
//     var best_hand_players;
//     var current_pot_to_split = 0;
//     var pot_remainder = 0;
//     if (global_pot_remainder) {
//       gui_log_to_history("transferring global pot remainder " + global_pot_remainder);
//       pot_remainder = global_pot_remainder;
//       my_total_pot_size += global_pot_remainder;
//       global_pot_remainder = 0;
//     }
  
//     while (my_total_pot_size > (pot_remainder + 0.9) && still_active_candidates) {
//   //    gui_log_to_history("splitting pot with pot " + my_total_pot_size +
//   //                       " and remainder " + pot_remainder +
//   //                       " on " + still_active_candidates + " candidates" );
  
//       // The first round all who not folded or busted are candidates
//       // If that/ose winner(s) cannot get all of the pot then we try
//       // with the remaining players until the pot is emptied
//       // we are modifying the candidates value at the end of the round here.
//       var winners = get_winners(candidates);
//       if (!best_hand_players) {
//         best_hand_players = winners;
//       }
//       if (!winners) {
//   //      gui_log_to_history("no winners");
//         my_pseudo_alert("No winners for the pot ");
//         pot_remainder = my_total_pot_size;
//         my_total_pot_size = 0;
//         break;
//       }
  
//       // Get the lowest winner bet, e.g. an all-in
  
//       // getting the bet of the winner but whoever is the lowest one
//       // For example if the bets of winners are [25,10,20,30], this will get 10
//       // say mytotalbetsperplayer is [25,10,20,30] then 
//       // winners are [10,30] then lowest winner bet 10
  
//       // iteration 2: mytotalbetsperplayer is [15,0,10,20]
//       // winners are [0,20] then . 
//       var lowest_winner_bet = my_total_pot_size * 2;
//       var num_winners = 0;
//       for (i = 0; i < winners.length; i++) {
//         // winners will be array of [empty,...,winner, ...]
//         if (!winners[i]) { // Only the winners bets
//           continue;
//         }
//         if (!my_best_hand_name) {
//           my_best_hand_name = winners[i]["hand_name"];
//         }
//         num_winners++;
//         if (my_total_bets_per_player[i] < lowest_winner_bet) {
//           lowest_winner_bet = my_total_bets_per_player[i];
//         }
//       }
  
//       // Compose the pot
//       // If your bet was less than (a fold) or equal to the lowest winner bet:
//       //    then add it to the current pot
//       // If your bet was greater than lowest:
//       //    then just take the 'lowest_winner_bet' to the pot
  
//       // Take in any fraction from a previous split
//   //    if (pot_remainder) {
//   //      gui_log_to_history("increasing current pot with remainder " + pot_remainder);
//   //    }
  
//       // here lowest winner bet will be 10 and winners are [10,30], mytotalbets are [25,10,20,30]
//       // scenario 1 : mytotalbets [25,10,20,30] lowestwinnerbet [10] winners [10,30]
//       // at the end the values are [15,0,10,20] currentpottosplit = 40 
  
//       current_pot_to_split = pot_remainder;
//       pot_remainder = 0;
  
//       for (i = 0; i < players.length; i++) {
//         if (lowest_winner_bet >= my_total_bets_per_player[i]) {
//           current_pot_to_split += my_total_bets_per_player[i];
//           my_total_bets_per_player[i] = 0;
//         } else {
//           current_pot_to_split += lowest_winner_bet;
//           my_total_bets_per_player[i] -= lowest_winner_bet;
//         }
//       }
  
//       // Divide the pot - in even integrals
//   //    gui_log_to_history("Divide the pot " + current_pot_to_split +
//   //                       " on " + num_winners + " winner(s)");
//       // share is 40/2 = 20
//       var share = Math.floor(current_pot_to_split / num_winners);
//       // and save any remainders to next round
//       // potremainder is 0 mytotalpotsize = 85
//       pot_remainder = current_pot_to_split - share * num_winners;
  
//   //    gui_log_to_history("share " + share + " remainder " + pot_remainder);
  
//       for (i = 0; i < winners.length; i++) {
//         if (my_total_bets_per_player[i] < 0.01) {
//           candidates[i] = null;           // You have got your share
//         }
//         if (!winners[i]) {                // You should not have any
//           continue;
//         }
//         my_total_pot_size -= share;       // Take from the pot
//         allocations[i] += share;          // and give to the winners
//         winning_hands[i] = winners[i].hand_name;
//       }
  
//       // Iterate until pot size is zero - or no more candidates
//       for (i = 0; i < candidates.length; i++) {
//         if (candidates[i] == null) {
//           continue;
//         }
//         still_active_candidates += 1
//       }
//       if (still_active_candidates == 0) {
//         pot_remainder = my_total_pot_size;
//   //      gui_log_to_history("no more candidates, pot_remainder " + pot_remainder);
//       }
//       gui_log_to_history("End of iteration");
//     } // End of pot distribution
  
//     global_pot_remainder = pot_remainder;
//   //  gui_log_to_history("distributed; global_pot_remainder: " +
//   //                     global_pot_remainder +
//   //                     " pot_remainder: " + pot_remainder);
//     pot_remainder = 0;
//     var winner_text = "";
//     var human_loses = 0;
//     // Distribute the pot - and then do too many things
//     for (i = 0; i < allocations.length; i++) {
//       if (allocations[i] > 0) {
//         var a_string = "" + allocations[i];
//         var dot_index = a_string.indexOf(".");
//         if (dot_index > 0) {
//           a_string = "" + a_string + "00";
//           allocations[i] = a_string.substring(0, dot_index + 3) - 0;
//         }
//         winner_text += winning_hands[i] + " gives " + allocations[i] +
//                        " to " + players[i].name + ". ";
//         players[i].bankroll += allocations[i];
//         if (best_hand_players[i]) {
//           // function write_player(n, hilite, show_cards)
//           write_player(i, 2, 1);
//         } else {
//           write_player(i, 1, 1);
//         }
//       } else {
//         if (!has_money(i) && players[i].status != "BUST") {
//           players[i].status = "BUST";
//           if (i == 0) {
//             human_loses = 1;
//           }
//         }
//         if (players[i].status != "FOLD") {
//           write_player(i, 0, 1);
//         }
//       }
//     }
//     // Have a more liberal take on winning
//     if (allocations[0] > 5) {
//       HUMAN_WINS_AGAIN++;
//     } else {
//       HUMAN_WINS_AGAIN = 0;
//     }
  
//     var detail = "";
//     for (i = 0; i < players.length; i++) {
//       if (players[i].total_bet == 0 && players[i].status == "BUST") {
//         continue;  // Skip busted players
//       }
//       detail += players[i].name + " bet " + players[i].total_bet + " & got " +
//                 allocations[i] + ".\\n";
//     }
//     detail = " (<a href='javascript:alert(\"" + detail + "\")'>details</a>)";
  
//     var quit_text = "Restart";
//     var quit_func = new_game;
//     var continue_text = "Go on";
//     var continue_func = new_round;
  
//     if (players[0].status == "BUST" && !human_loses) {
//       continue_text = 0;
//       quit_func = function () {
//         parent.STOP_AUTOPLAY = 1;
//       };
//       setTimeout(autoplay_new_round, 1500 + 1100 * global_speed);
//     }
  
//     var num_playing = number_of_active_players();
//     if (num_playing < 2) {
//       // Convoluted way of finding the active player and give him the pot
//       for (i = 0; i < players.length; i++) {
//         // For whosoever hath, to him shall be given
//         if (has_money(i)) {
//           players[i].bankroll += pot_remainder;
//           pot_remainder = 0;
//         }
//       }
//     }
//     if (pot_remainder) {
//       var local_text = "There is " + pot_remainder + " put into next pot\n";
//       detail += local_text;
//     }
//     var hi_lite_color = gui_get_theme_mode_highlite_color();
//     var html = "<html><body topmargin=2 bottommargin=0 bgcolor=" + BG_HILITE +
//                " onload='document.f.c.focus();'><table><tr><td>" +
//                get_pot_size_html() +
//                "</td></tr></table><br><font size=+2 color=" + hi_lite_color +
//                "><b>Winning: " +
//                winner_text + "</b></font>" + detail + "<br>";
//     gui_write_game_response(html);
  
//     gui_setup_fold_call_click(quit_text,
//                               continue_text,
//                               quit_func,
//                               continue_func);
  
//     var elapsed_milliseconds = ((new Date()) - START_DATE);
//     var elapsed_time = makeTimeString(elapsed_milliseconds);
  
//     if (human_loses == 1) {
//       var ending = NUM_ROUNDS == 1 ? "1 deal." : NUM_ROUNDS + " deals.";
//       my_pseudo_alert("Sorry, you busted " + players[0].name + ".\n\n" +
//                       elapsed_time + ", " + ending);
//     } else {
//       num_playing = number_of_active_players();
//       if (num_playing < 2) {
//         var end_msg = "GAME OVER!";
//         var over_ending = NUM_ROUNDS == 1 ? "1 deal." : NUM_ROUNDS + " deals.";
//         if (has_money(0)) {
//           end_msg += "\n\nYOU WIN " + players[0].name.toUpperCase() + "!!!";
//         } else {
//           end_msg += "\n\nSorry, you lost.";
//         }
//         my_pseudo_alert(end_msg + "\n\nThis game lasted " + elapsed_time + ", " +
//                         over_ending);
//       }
//     }
//   }