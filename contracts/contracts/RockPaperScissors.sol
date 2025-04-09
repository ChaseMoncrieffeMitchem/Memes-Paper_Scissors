// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RockPaperScissors is ReentrancyGuard, Ownable {
    enum Move { NONE, ROCK, PAPER, SCISSORS }
    enum GameStatus { PENDING, COMPLETED, TIED }

    struct Game {
        address player1;
        address player2;
        Move player1Move;
        Move player2Move;
        uint256 wagerAmount;
        GameStatus status;
        uint256 timestamp;
    }

    // Game storage
    mapping(uint256 => Game) public games;
    uint256 public gameCount;
    
    // Player stats
    mapping(address => uint256) public gamesWon;
    mapping(address => uint256) public gamesPlayed;

    // Events matching the GameBuilder pattern
    event GameCreated(uint256 indexed gameId, address indexed player1, uint256 wagerAmount);
    event MoveMade(uint256 indexed gameId, address indexed player, Move move);
    event GameResolved(
        uint256 indexed gameId, 
        address indexed winner,
        uint256 stakeAmount,
        Move player1Move,
        Move player2Move
    );

    constructor() Ownable(msg.sender) {}

    function createGame() external payable returns (uint256) {
        require(msg.value > 0, "Must send AVAX to create game");

        uint256 gameId = gameCount++;
        games[gameId] = Game({
            player1: msg.sender,
            player2: address(0),
            player1Move: Move.NONE,
            player2Move: Move.NONE,
            wagerAmount: msg.value,
            status: GameStatus.PENDING,
            timestamp: block.timestamp
        });

        emit GameCreated(gameId, msg.sender, msg.value);
        return gameId;
    }

    function joinGame(uint256 gameId) external payable {
        Game storage game = games[gameId];
        require(game.player1 != address(0), "Game doesn't exist");
        require(game.player2 == address(0), "Game already full");
        require(msg.value == game.wagerAmount, "Must match wager amount");
        require(msg.sender != game.player1, "Cannot play against yourself");

        game.player2 = msg.sender;
    }

    function makeMove(uint256 gameId, uint8 move) external {
        require(move > uint8(Move.NONE) && move <= uint8(Move.SCISSORS), "Invalid move");
        Move playerMove = Move(move); // Cast to enum after validation
        Game storage game = games[gameId];
        require(game.status == GameStatus.PENDING, "Game not pending");
        require(msg.sender == game.player1 || msg.sender == game.player2, "Not your game");

        if (msg.sender == game.player1) {
        require(game.player1Move == Move.NONE, "Move already made");
        game.player1Move = playerMove;
        } else {
        require(game.player2Move == Move.NONE, "Move already made");
        game.player2Move = playerMove;
        }

        emit MoveMade(gameId, msg.sender, playerMove);

        // If both moves made, resolve the game
        if (game.player1Move != Move.NONE && game.player2Move != Move.NONE) {
        _resolveGame(gameId);
        }
}

    function _resolveGame(uint256 gameId) private {
        Game storage game = games[gameId];
    
        // Update played stats
        gamesPlayed[game.player1]++;
        gamesPlayed[game.player2]++;

        // Determine winner
        address winner;
        uint256 payout;

        if (game.player1Move == game.player2Move) {
        game.status = GameStatus.TIED;
        winner = address(0); // No winner in a tie
        payout = 0;
        // Refund both players
        (bool sent1, ) = game.player1.call{value: game.wagerAmount}("");
        require(sent1, "Failed to refund player1");
        (bool sent2, ) = game.player2.call{value: game.wagerAmount}("");
        require(sent2, "Failed to refund player2");
        } else {
        game.status = GameStatus.COMPLETED;
        winner = _determineWinner(game.player1Move, game.player2Move) == game.player1Move 
            ? game.player1 
            : game.player2;
        gamesWon[winner]++;
        payout = game.wagerAmount * 2;
        (bool sent, ) = winner.call{value: payout}("");
        require(sent, "Failed to send AVAX");
    }

        emit GameResolved(
        gameId,
        winner,
        payout,
        game.player1Move,
        game.player2Move
    );
}

    function _determineWinner(Move move1, Move move2) private pure returns (Move) {
        if (move1 == move2) return move1;
        
        if (
            (move1 == Move.ROCK && move2 == Move.SCISSORS) ||
            (move1 == Move.PAPER && move2 == Move.ROCK) ||
            (move1 == Move.SCISSORS && move2 == Move.PAPER)
        ) {
            return move1;
        }
        return move2;
    }

    // View functions
    function getGame(uint256 gameId) external view returns (Game memory) {
        return games[gameId];
    }

    function getPlayerStats(address player) external view returns (uint256 won, uint256 played) {
        return (gamesWon[player], gamesPlayed[player]);
    }
} 