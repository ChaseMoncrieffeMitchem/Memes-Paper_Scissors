// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

interface LinkTokenInterface {
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
}

interface VRFCoordinatorV2Interface {
    function requestRandomWords(
        bytes32 keyHash,
        uint256 s_subscriptionId,
        uint16 requestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId);
}

contract RockPaperScissors is ReentrancyGuard, Ownable, VRFConsumerBaseV2 {
    VRFCoordinatorV2Interface COORDINATOR;

    address vrfCoordinator = 0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE;
    address linkToken = 0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846;
    uint256 subscriptionId;
    bytes32 keyHash = 0xc799bd1e3bd4d1a41cd4968997a4e03dfd2a3c7c04b695881138580163f42887;

    uint256 public constant WAGER_AMOUNT = 0.0000001 ether;
    uint256 public constant PAYOUT_AMOUNT = 0.0000002 ether;

    enum Move { None, Rock, Paper, Scissors }
    enum GameState { Pending, MovesSubmitted, Resolved }

    struct Game {
        address player1;
        address player2;
        Move move1;
        Move move2;
        GameState state;
        uint256 randomRequestId;
    }

    mapping(uint256 => Game) public games;
    mapping(address => uint256) public gamesWon;
    mapping(address => uint256) public gamesPlayed;
    uint256 public gameCounter;

    mapping(uint256 => uint256) public requestIdToGameId;

    event GameCreated(uint256 gameId, address player1);
    event PlayerJoined(uint256 gameId, address player2);
    event MovesSubmitted(uint256 gameId);
    event GameResolved(uint256 gameId, address winner);

    constructor(uint256 _subscriptionId) VRFConsumerBaseV2(vrfCoordinator) Ownable(msg.sender) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        subscriptionId = _subscriptionId;
    }

    function createGame() external payable nonReentrant {
        require(msg.value == WAGER_AMOUNT, "Incorrect wager amount");
        gameCounter++;
        games[gameCounter] = Game(msg.sender, address(0), Move.None, Move.None, GameState.Pending, 0);
        gamesPlayed[msg.sender]++;
        emit GameCreated(gameCounter, msg.sender);
    }

    function joinGame(uint256 gameId) external payable nonReentrant {
        Game storage game = games[gameId];
        require(msg.value == WAGER_AMOUNT, "Incorrect wager amount");
        require(game.state == GameState.Pending, "Game not pending");
        require(game.player1 != address(0) && game.player2 == address(0), "Invalid game state");
        require(game.player1 != msg.sender, "Cannot join own game");

        game.player2 = msg.sender;
        gamesPlayed[msg.sender]++;
        emit PlayerJoined(gameId, msg.sender);
    }

    function makeMove(uint256 gameId, Move move_) external nonReentrant {
        Game storage game = games[gameId];
        require(move_ >= Move.Rock && move_ <= Move.Scissors, "Invalid move");
        require(game.state == GameState.Pending, "Moves already submitted");
        require(msg.sender == game.player1 || msg.sender == game.player2, "Not a player");

        if (msg.sender == game.player1) {
            require(game.move1 == Move.None, "Move already made");
            game.move1 = move_;
        } else {
            require(game.move2 == Move.None, "Move already made");
            game.move2 = move_;
        }

        if (game.move1 != Move.None && game.move2 != Move.None) {
            game.state = GameState.MovesSubmitted;
            requestRandomness(gameId);
            emit MovesSubmitted(gameId);
        }
    }

    function requestRandomness(uint256 gameId) internal {
        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            3, // Request confirmations
            100000, // Callback gas limit
            1 // Number of random words
        );
        requestIdToGameId[requestId] = gameId;
        games[gameId].randomRequestId = requestId;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
    uint256 gameId = requestIdToGameId[requestId];
    Game storage game = games[gameId];
    require(game.state == GameState.MovesSubmitted, "Game not ready for resolution");

    resolveGame(gameId);
}

    function resolveGame(uint256 gameId) internal {
        Game storage game = games[gameId];
        game.state = GameState.Resolved;

        address winner = determineWinner(game.move1, game.move2, game.player1, game.player2);
        if (winner == address(0)) {
            payable(game.player1).transfer(WAGER_AMOUNT);
            payable(game.player2).transfer(WAGER_AMOUNT);
        } else {
            payable(winner).transfer(PAYOUT_AMOUNT);
            gamesWon[winner]++;
        }
        emit GameResolved(gameId, winner);
    }

    function determineWinner(Move move1, Move move2, address player1, address player2) internal pure returns (address) {
        if (move1 == move2) return address(0); // Tie
        if ((move1 == Move.Rock && move2 == Move.Scissors) ||
            (move1 == Move.Paper && move2 == Move.Rock) ||
            (move1 == Move.Scissors && move2 == Move.Paper)) {
            return player1; // Player 1 wins
        }
        return player2; // Player 2 wins
    }

    function withdrawLink() external onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(linkToken);
        require(link.transfer(msg.sender, link.balanceOf(address(this))), "Unable to transfer");
    }
}