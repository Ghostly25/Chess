'use strict';

/**
 * ICS4UC Final Project
 * 
 * Author: Denis Gabriel Ortega Cabrera
 * Description: Two-player strategy game from the 500's
 * 
 */
// -------------------------------------------- Variables ----------------------------------------------
const canvas = $("myCanvas");
const ctx = canvas.getContext("2d");
let board = [];
let time_1 = 600;
let time_2 = 600;
let player_turn = true;
let first_click = true;
let selected_piece = null;
let turn_number = 1;
let piece_to_move;
let piece_to_move_coords;
let timer1;
let timer2;
let block_input = true;
let promoted_piece = null;
// --------------------------------------- Event Listeners ----------------------------------------------
window.addEventListener("click", show_coords);
$("queen").addEventListener("click", pawn_promotion);
$("rook").addEventListener("click", pawn_promotion);
$("bishop").addEventListener("click", pawn_promotion);
$("knight").addEventListener("click", pawn_promotion);
$("instruction_button").addEventListener("click", show_instructions);
$("start_button").addEventListener("click", start_game);
$("set_time").addEventListener("change", set_time);
$("rematch").addEventListener("click", restart_game);
$("end_game").addEventListener("click", end_game);
// --------------------------------------- Board setup ----------------------------------------------
board_setup()
build_canvas_board()
put_letter()
// ----------------------------------------------- Classes ---------------------------------------------
class Pieces {
  type;
  colour;
  x;
  y;
  first_move;
  is_taken;
  capture;

  constructor(type, colour, x, y) {
    // All you need is the type, colour, x, and y
    this.type = type;
    this.colour = colour;
    this.x = x;
    this.y = y;
    this.first_move = true;
    this.is_taken = false;
  }

  is_square_empty(next) {
    // If next emptly or null
    const x = next[0];
    const y = next[1];
    return ((x >= 0) && (x < 8) && (y < 8) && (y >= 0) && (board[y][x] == null));
  }

  is_capture_valid(next) {
    // Is this capture valid and you're not in check?
    const x = next[0];
    const y = next[1];
    return ((x >= 0) && (x < 8) && (y < 8) && (y >= 0) && (board[y][x] !== null) && (board[y][x].colour !== this.colour) && (!this.is_in_check()));
  }

  move(new_x, new_y) {
    // Get that valid move list
    const valid_moves = this.valid_moves();
    // Where we going
    const destination = [new_x, new_y];
    // For the King caslting
    const side_move = (new_x < this.x) ? "queen_side" : "king_side";
    // Make all of these false to make sure it won't be triggered again
    this.capture = false;
    this.has_castle = false;
    this.en_passant_capture = false;
    // Is the king castling?
    if (this.type == "King") {
      // Check if we can do it
      if (this.castle(side_move)) {
        // YAY we did
        // Make it true and do the notation
        this.has_castle = true;
        this.move_notation(new_x, new_y);
        return true;
      }
    }
    // Is this pawn about to en passant?
    if (this.type == "Pawn") {
      // The the en_passant moves
      const ep_moves = this.en_passant_moves();
      for (let i = 0; i < ep_moves.length; i++) {
        // Double make sure it is a valid move
        if (ep_moves[i][0] == new_x && ep_moves[i][1] == new_y) {
          if (new_x > this.x) {
            // Take the right piece
            board[this.y][this.x + 1].is_taken = true;
            // You sure did capture en passant, let make that true
            this.en_passant_capture = true;
            break;
          }
          else if (new_x < this.x) {
            // Take the left piece
            board[this.y][this.x - 1].is_taken = true;
            // You sure did capture en passant, let make that true
            this.en_passant_capture = true;
            break;
          }
        }
      }
    }
    // Making sure the destination is a valid move
    for (let i = 0; i < valid_moves.length; i++) {
      const current_move = valid_moves[i];
      if (current_move[0] == destination[0] && current_move[1] == destination[1]) {
        // If it was a capture
        if (board[new_y][new_x] !== null) {
          // Take that piece and make that variable true
          board[new_y][new_x].is_taken = true;
          this.capture = true;
        }
        // Call the notation function
        this.move_notation(new_x, new_y);
        // YAY
        return true;
      }
    }
    // Invaild move
    return false;
  }

  is_in_check() {
    // Get the king of that colour
    const king = this.colour === 'white' ? whiteKing : blackKing;
    // All possible transfromations of the queen's movement, let's apply it to the king and see if there is a Queen, Rook, or Bishop on those lines. If so, it is giving check.
    const queen_moves = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];
    for (let i = 0; i < queen_moves.length; i++) {
      let x = king.x + queen_moves[i][0];
      let y = king.y + queen_moves[i][1];
      // While we are still in the confinds of this world
      while (x >= 0 && x < 8 && y >= 0 && y < 8) {
        // If there is a piece
        if (board[y][x]) {
          // If that piece is a Queen or a rook that move straight
          if (((board[y][x].type == "Queen" || board[y][x].type == "Rook") && (queen_moves[i][0] == 0 || queen_moves[i][1] == 0)) && board[y][x].colour != king.colour) {
            // There is a piece that is giving a check to the king
            return true;
          }
          // Is it a Queen or a Bishop take can move on diagonals?
          else if (((board[y][x].type == "Queen" || board[y][x].type == "Bishop") && (queen_moves[i][0] != 0 && queen_moves[i][1] != 0)) && board[y][x].colour != king.colour) {
            // There is a piece that is giving a check to the king
            return true;
          }
          else {
            // No piece found
            break;
          }
        }
        // Check again!
        x += queen_moves[i][0];
        y += queen_moves[i][1]
      }
    }
    // The kings set of possible move transformation. Same thing as before, apply the transfromation and see if there is a king there
    const king_moves = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];
    for (let i = 0; i < king_moves.length; i++) {
      const x = king.x + king_moves[i][0];
      const y = king.y + king_moves[i][1];
      // Is there a king in that new place?
      if (x >= 0 && x < 8 && y >= 0 && y < 8 && board[y][x] && board[y][x].type == "King" && board[y][x].colour != king.colour) {
        // There was a king there
        return true;
      }
    }
    // Same thing, apply transfromations and check
    const knight_moves = [
      [-2, -1], [-2, 1],
      [2, -1], [2, 1],
      [-1, -2], [-1, 2],
      [1, -2], [1, 2]
    ];

    for (let i = 0; i < knight_moves.length; i++) {
      const x = king.x + knight_moves[i][0];
      const y = king.y + knight_moves[i][1];
      // Is there a knight in that new place?
      if (x >= 0 && x < 8 && y >= 0 && y < 8 && board[y][x] && board[y][x].type == "Knight" && board[y][x].colour != king.colour) {
        // There is a piece that is giving a check to the king
        return true;
      }
    }
    // Same thing, apply transfromations and check
    const pawn_moves = king.colour == "white" ? [[-1, -1], [1, -1]] : [[-1, 1], [1, 1]];

    for (let i = 0; i < pawn_moves.length; i++) {
      const x = king.x + pawn_moves[i][0];
      const y = king.y + pawn_moves[i][1];
      // Is there a pawn in that new place?
      if (x >= 0 && x < 8 && y >= 0 && y < 8 && board[y][x] && board[y][x].type == "Pawn" && board[y][x].colour != king.colour) {
        // There is a piece that is giving a check to the king
        return true;
      }
    }
    // YAY there wasn't one
    return false;
  }

  can_block(next, moves) {
    // Simulate move and check if it is in check
    const og_x = this.x;
    const og_y = this.y;
    board[this.y][this.x] = null;
    this.x = next[0];
    this.y = next[1];
    board[this.y][this.x] = this;
    // You not in check?
    if (!this.is_in_check()) {
      // add to the list
      moves.push(next);
    }
    // move back
    board[this.y][this.x] = null;
    this.x = og_x;
    this.y = og_y;
    board[this.y][this.x] = this;
  }

  move_notation(new_x, new_y) {
    // Get the file, rank, enemy king, the intial file, and the final square
    const enemy_king = this.colour == "white" ? blackKing : whiteKing;
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
    const initial_file = files[this.x];
    const final_square = files[new_x] + ranks[new_y];
    // If it is pawn don't add the P but if it is anything else, add the first character of it
    let notation = this.type == "Pawn" ? "" : this.type.charAt(0);
    // If it is a pawn and it was a captrue
    if (this.type == "Pawn") {
      if (this.capture) {
        notation += initial_file + "x"
      }
    }
    // anything else
    else {
      // There could be 3 piece or more so make sure to account for everything
      const identical_pieces = this.same_type_pieces();
      const identical_pieces_moves = [];
      // Keep count if there was a match of valid moves
      let match = false; 
      for (let piece of identical_pieces) {
        const moves = piece.valid_moves();
        for (let move of moves) {
          identical_pieces_moves.push(move);
          if (move[0] == new_x && move[1] == new_y) match = true; // There was
        }
      }
      // If there was, how many piece did it match to
      if (match) {
        let same_file_count = 0;
        let same_rank_count = 0;

        for (let piece of identical_pieces) {
          // if it was the same rand or file
          if (piece.x == this.x) same_file_count++;
          else if (piece.y == this.y) same_rank_count++;
        }

        for (let piece of identical_pieces) {
          if (piece.x == this.x) {
            // Make sure you know which one you are talking about
            notation += ranks[this.y];
            // if there was only one other piece, leave the loop
            if (same_file_count < 1 || same_rank_count < 1) {
              break;
            }
          }
          else if (piece.y == this.y) {
            // Make sure you know which one you are talking about
            notation += initial_file;
            // if there was only one other piece, leave the loop
            if (same_file_count < 1 || same_rank_count < 1) {
              break;
            }
          }
          // Make sure you know which one you are talking about
          else notation += initial_file;
        }
      }
      // If capture
      if (this.capture) notation += "x";
    }
    // Add the final square
    notation += final_square;
    // If En passant was done
    if (this.type == "Pawn" && this.en_passant_capture) {
      notation = initial_file + "x" + final_square + " e.p.";
    } 
    // If king castled, check which one was done
    if (this.type == "King" && this.has_castle) {
      if (this.x > 4) notation = "O-O";
      else notation = "O-O-O";
    }
    // If the king did caslte, the move is already done. Any other cases, make the move
    if (!this.has_castle) {
      board[this.y][this.x] = null;
      this.x = new_x;
      this.y = new_y;
      this.first_move = false;
      board[this.y][this.x] = this;
      // Pawn Promotion
      if (this.type == "Pawn" && this.can_promote()) {
        show_pawn_promotion();
        promoted_piece = selected_piece;
        notation = ""; // Null it
      }
    }
    // Check for checkmate, check, or stalemate.
    if (this.is_checkmate()) {
      notation += "#";
      game_over(this.colour);
    }
    else if (enemy_king.is_in_check()) notation += "+";
    else if (this.is_stalemate(enemy_king.colour)) {
      notation += "$";
      game_over(enemy_king.colour);
    }
    // Display it to the screen
    if (notation.length > 0) {
      if (player_turn) {
        const turn = Math.round(turn_number / 2);
        $("moveset_turns").innerHTML += turn;
        $("moveset_turns").innerHTML += ". ";
        $("moveset_turns").innerHTML += "<br>";
        $("moveset_white").innerHTML += notation;
        $("moveset_white").innerHTML += " ";
        $("moveset_white").innerHTML += "<br>";
      }
      else {
        $("moveset_black").innerHTML += notation;
        $("moveset_black").innerHTML += "<br>";
      }
    }
  }

  same_type_pieces() {
   // Just getting the same pieces of the same colour and type
    const pieces = [];
    for (let row of board) {
      for (let piece of row) {
        if (piece !== null && piece.type == this.type && piece.colour == this.colour && piece !== this) {
          pieces.push(piece);
        }
      }
    }
    return pieces;
  }

  all_pieces(colour) {
    // All other piece of same colour
    const pieces = [];
    for (let row of board) {
      for (let piece of row) {
        if (piece !== null && piece.colour == colour) pieces.push(piece);
      }
    }
    return pieces
  }

  is_checkmate() {
    // Get the enemy colour, king, and pieces
    const enemy = this.colour == "white" ? "black" : "white";
    const enemy_king = this.colour == "white" ? blackKing : whiteKing;
    const enemy_pieces = this.all_pieces(enemy);
    // If the enemy king is not in check it is not checkmate
    if (!enemy_king.is_in_check()) return false;
    // Go throught all the pieces of the enemy and check if they can move to block the check
    for (let piece of enemy_pieces) {
      const moves = piece.valid_moves();
      for (let move of moves) {
        const og_piece = board[move[1]][move[0]];

        board[move[1]][move[0]] = piece;
        board[piece.y][piece.x] = null;
        // Is it no longer in check, then no more checkmate
        if (!enemy_king.is_in_check()) {
          // Move back return false
          board[move[1]][move[0]] = og_piece;
          board[piece.y][piece.x] = piece;
          return false;
        }
        // Move back
        board[move[1]][move[0]] = og_piece;
        board[piece.y][piece.x] = piece;
      }
    }
    // Checkmate!!
    return true;
  }

  is_stalemate(colour) {
    // Get the pieces and the king
    const pieces = this.all_pieces(colour);
    const king = colour == "white" ? whiteKing : blackKing;
    // Can the king more or is it in check
    if (king.valid_moves() > 0 || king.is_in_check()) return false; // King can either move or it is in check
    
    for (let piece of pieces) {
      // You can still checkmate with this
      if (piece.type == "Pawn" || piece.type == "Queen" || piece.type == "Rook") {
        if (piece.valid_moves().length > 0) return false; // There is an other piece that can move
      }
      else {
        let identical_pieces = piece.same_type_pieces();
        if (piece.type == "Bishop" && identical_pieces.length > 0) {
          for (let other_bishop of identical_pieces) {
            // For enough pieces to just a checkmate, you will need two or more bishops that are on opposite colour squares or two or more knights

            // Check if the other bishop is on the other colour square
            if ((other_bishop.y % 2 == 0 && other_bishop.x % 2 == 0) || (other_bishop.y % 2 == 1 && other_bishop.x % 2 == 1)) {
              if ((piece.y % 2 == 1 && piece.x % 2 == 0) || (piece.y % 2 == 0 && piece.x % 2 == 1)) return false; // The other bishop is on a white colour square and the other one is on a dark colour square
            }
            else if ((other_bishop.y % 2 == 1 && other_bishop.x % 2 == 0) || (other_bishop.y % 2 == 0 && other_bishop.x % 2 == 1)) {
              if ((piece.y % 2 == 0 && piece.x % 2 == 0) || (piece.y % 2 == 1 && piece.x % 2 == 1)) return false; // The other bishop is on a drak colour square and the other one is on a white colour square
            }
          }
        }
        else if (piece.type == "Knight" && identical_pieces.length > 0) return false; // There are at least two knights
      }
    }
    return true; // It is a stalemate
  }
}

class King extends Pieces {
  // To make one you just need the colour, x, and y. WOW
  constructor(colour, x, y) {
    super("King", colour, x, y);
    this.has_castle = false;
  }

  draw() {
     // WE CAN DRAW IT!!!!
    const image = new Image();
    image.src = this.colour == "black" ? "./images/Black_King.png" : "./images/White_King.png";
    image.onload = () => {
      ctx.drawImage(image, ((this.x * 100) + 10), (this.y * 100 + 7), 80, 80);
    };
  }

  valid_moves() {
    // Store variable and the possible transfromations
    const moves = [];
    const king_moves = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];
    // Do the transfromations
    for (let i = 0; i < king_moves.length; i++) {
      const x = this.x + king_moves[i][0];
      const y = this.y + king_moves[i][1];
      // Are they in the confinds of this world?
      if (x >= 0 && x < 8 && y >= 0 && y < 8) {
        // Is the square empty or it is a capture square?
        if (this.is_square_empty([x, y]) || this.is_capture_valid([x, y])) {
          // Simulate the move
          const og_x = this.x;
          const og_y = this.y;
          board[this.y][this.x] = null;
          this.x = x;
          this.y = y;
          // You in check?
          if (!this.is_in_check()) {
            // Nah? Good
            moves.push([x, y]);
          }
          // Move back
          this.x = og_x;
          this.y = og_y;
          board[this.y][this.x] = this;
        }
      }
    }
    // Can you castle?
    if (this.can_castle("king_side")) moves.push([this.x + 2, this.y]);
    if (this.can_castle("queen_side")) moves.push([this.x - 2, this.y]);
    // You in trouble fool
    if (moves.length < 0) return false; 
    // Return moves
    return moves;
  }

  is_capture_valid(next) {
    // Just check if it is in the confinds of the world and it is a enemy piece
    const x = next[0];
    const y = next[1];
    return ((x >= 0) && (x < 8) && (y < 8) && (y >= 0) && (board[y][x] !== null) && (board[y][x].colour !== this.colour));
  }

  can_castle(side) {
    // If it is in check or the king/rook already moved, we can't castle
    if (this.is_in_check()) return false;
    if (this.first_move == false || this.rook_moved(side)) return false;
    // What side move is the king doing? Also, how many squares are we checking?
    const side_move = side == "queen_side" ? -1 : 1;
    const squares_check = side == "queen_side" ? 3 : 2;
    // Is the path clear for the King to castle?
    for (let i = 1; i <= squares_check; i++) {
      const x = this.x + i * side_move;
      if (!this.is_square_empty([x, this.y])) return false; // NOPE
    }
    // Let's see if you're gonna end up in check
    for (let i = 1; i <= 2; i++) {
      // Simulate the move
      const x = this.x + 1 * side_move;
      const og_x = this.x;
      const og_y = this.y;
      board[this.y][this.x] = null;
      this.x = x;
      // You in check?
      if (this.is_in_check()) {
        // Damn, sorry :(
        this.x = og_x;
        this.y = og_y;
        board[this.y][this.x] = this;
        return false;
      }
      // Ok, we can castle. Now move back.
      this.x = og_x;
      this.y = og_y;
      board[this.y][this.x] = this;
    }
    // YAY
    return true;
  }

  rook_moved(side) {
    // Did your rook move already?
    // But like which rook?
    const rook_x = side == "queen_side" ? 0 : 7;
    // Get the rook that we need
    const rook = board[this.y][rook_x];
    // Now, have you moved?
    if (rook !== null && rook.type === "Rook" && rook.first_move) {
      return false; // YAY
    }
    return true; // BOOOOOO
  }

  castle(side) {
    // Let's do it!
    // But let's double make sure you can do it
    if (!this.can_castle(side)) return false;
    // what side step we doing?
    const side_move = side == "queen_side" ? -1 : 1;
    const king_x = this.x + 2 * side_move;
    // Make the move
    board[this.y][this.x] = null;
    this.x = king_x;
    board[this.y][this.x] = this;
    // Don't forget about the rook
    const rook_x = side == "queen_side" ? 0 : 7;
    const rook = board[this.y][rook_x];
    board[this.y][rook_x] = null;
    rook.x = king_x - side_move;
    board[this.y][rook.x] = rook;
    // No more moving for you
    this.first_move = false;
    rook.first_move = false;
    // YAY
    return true;
  }
}

class Queen extends Pieces {
  // To make one you just need the colour, x, and y. WOW
  constructor(colour, x, y) {
    super("Queen", colour, x, y);
  }

  draw() {
     // WE CAN DRAW IT!!!!
    const image = new Image();
    image.src = this.colour == "black" ? "./images/Black_Queen.png" : "./images/White_Queen.png";
    image.onload = () => {
      ctx.drawImage(image, (this.x * 100 + 10), (this.y * 100 + 7), 80, 80);
    };
  }

  valid_moves() {
    // Store it in this
    const moves = [];

    // Rook move logic
    for (let i = this.x - 1; i >= 0; i--) {
      const next = [i, this.y];
      if (this.is_square_empty(next)) {
        if (!this.is_in_check()) moves.push(next);
        else this.can_block(next, moves);
      }
      else if (this.is_capture_valid(next)) {
        moves.push(next);
        break;
      }
      else {
        break;
      }
    }

    for (let i = this.x + 1; i < 8; i++) {
      const next = [i, this.y];
      if (this.is_square_empty(next)) {
        if (!this.is_in_check()) moves.push(next);
        else this.can_block(next, moves);
      }
      else if (this.is_capture_valid(next)) {
        moves.push(next);
        break;
      }
      else {
        break;
      }
    }

    for (let i = this.y - 1; i >= 0; i--) {
      const next = [this.x, i];
      if (this.is_square_empty(next)) {
        if (!this.is_in_check()) moves.push(next);
        else this.can_block(next, moves);
      }
      else if (this.is_capture_valid(next)) {
        moves.push(next);
        break;
      }
      else {
        break;
      }
    }

    for (let i = this.y + 1; i < 8; i++) {
      const next = [this.x, i];
      if (this.is_square_empty(next)) {
        if (!this.is_in_check()) moves.push(next);
        else this.can_block(next, moves);
      }
      else if (this.is_capture_valid(next)) {
        moves.push(next);
        break;
      }
      else {
        break;
      }
    }

    // Bishop move logic
    for (let i = 1; this.x - 1 >= 0 && this.y - 1 >= 0; i++) {
      const next = [this.x - i, this.y - i];
      if (this.is_square_empty(next)) {
        if (!this.is_in_check()) moves.push(next);
        else this.can_block(next, moves);
      }
      else if (this.is_capture_valid(next)) {
        moves.push(next);
        break;
      }
      else {
        break;
      }
    }

    for (let i = 1; this.x - 1 >= 0 && this.y + 1 < 8; i++) {
      const next = [this.x - i, this.y + i];
      if (this.is_square_empty(next)) {
        if (!this.is_in_check()) moves.push(next);
        else this.can_block(next, moves);
      }
      else if (this.is_capture_valid(next)) {
        moves.push(next);
        break;
      }
      else {
        break;
      }
    }

    for (let i = 1; this.x + 1 < 8 && this.y + 1 < 8; i++) {
      const next = [this.x + i, this.y + i];
      if (this.is_square_empty(next)) {
        if (!this.is_in_check()) moves.push(next);
        else this.can_block(next, moves);
      }
      else if (this.is_capture_valid(next)) {
        moves.push(next);
        break;
      }
      else {
        break;
      }
    }

    for (let i = 1; this.x + 1 < 8 && this.y - 1 >= 0; i++) {
      const next = [this.x + i, this.y - i];
      if (this.is_square_empty(next)) {
        if (!this.is_in_check()) moves.push(next);
        else this.can_block(next, moves);
      }
      else if (this.is_capture_valid(next)) {
        moves.push(next);
        break;
      }
      else {
        break;
      }
    }
    return moves;
  }
}

class Bishop extends Pieces {
  // To make one you just need the colour, x, and y. WOW
  constructor(colour, x, y) {
    super("Bishop", colour, x, y);
  }

  draw() {
     // WE CAN DRAW IT!!!!
    const image = new Image();
    // What image we put based on the colour
    image.src = this.colour == "black" ? "./images/Black_Bishop.png" : "./images/White_Bishop.png";
    // Put it in position on load
    image.onload = () => {
      ctx.drawImage(image, (this.x * 100 + 10), (this.y * 100 + 7), 80, 80);
    };
  }

  valid_moves() {
    // Store variable
    const moves = [];
    // Check the left-down diagonal if path is clear, if we see a piece we can capture, end the loop. If we find a deadend, end the loop
    for (let i = 1; this.x - 1 >= 0 && this.y - 1 >= 0; i++) {
      const next = [this.x - i, this.y - i];
      if (this.is_square_empty(next)) {
        if (!this.is_in_check()) moves.push(next);
        else this.can_block(next, moves);
      }
      else if (this.is_capture_valid(next)) {
        moves.push(next);
        break;
      }
      else {
        break;
      }
    }
    // Check the left-up diagonal if path is clear, if we see a piece we can capture, end the loop. If we find a deadend, end the loop
    for (let i = 1; this.x - 1 >= 0 && this.y + 1 < 8; i++) {
      const next = [this.x - i, this.y + i];
      if (this.is_square_empty(next)) {
        if (!this.is_in_check()) moves.push(next);
        else this.can_block(next, moves);
      }
      else if (this.is_capture_valid(next)) {
        if (!this.is_in_check()) {
          moves.push(next);
          break;
        }
        else {
          this.can_block(next, moves);
          break;
        }
      }
      else {
        break;
      }
    }
    // Check the right-up diagonal if path is clear, if we see a piece we can capture, end the loop. If we find a deadend, end the loop
    for (let i = 1; this.x + 1 < 8 && this.y + 1 < 8; i++) {
      const next = [this.x + i, this.y + i];
      if (this.is_square_empty(next)) {
        if (!this.is_in_check()) moves.push(next);
        else this.can_block(next, moves);
      }
      else if (this.is_capture_valid(next)) {
        if (!this.is_in_check()) {
          moves.push(next);
          break;
        }
        else {
          this.can_block(next, moves);
          break;
        }
      }
      else {
        break;
      }
    }
    // Check the right-down diagonal if path is clear, if we see a piece we can capture, end the loop. If we find a deadend, end the loop
    for (let i = 1; this.x + 1 < 8 && this.y - 1 >= 0; i++) {
      const next = [this.x + i, this.y - i];
      if (this.is_square_empty(next)) {
        if (!this.is_in_check()) moves.push(next);
        else this.can_block(next, moves);
      }
      else if (this.is_capture_valid(next)) {
        if (!this.is_in_check()) {
          moves.push(next);
          break;
        }
        else {
          this.can_block(next, moves);
          break;
        }
      }
      else {
        break;
      }
    }
    return moves;
  }
}

class Rook extends Pieces {
  // To make one you just need the colour, x, and y. WOW
  constructor(colour, x, y) {
    super("Rook", colour, x, y);
  }

  draw() {
     // WE CAN DRAW IT!!!!
    const image = new Image();
    // What image we put based on the colour
    image.src = this.colour == "black" ? "./images/Black_Rook.png" : "./images/White_Rook.png";
    // Put it in position on load
    image.onload = () => {
      ctx.drawImage(image, ((this.x * 100) + 10), (this.y * 100 + 7), 80, 80);
    };
  }

  valid_moves() {
    // Save everything in this array
    const moves = [];
    // Check all the way left if the path is clear, if it is not check if it is a capture. Get out of the loop as soon as you hit a dead end
    for (let i = this.x - 1; i >= 0; i--) {
      const next = [i, this.y];
      if (this.is_square_empty(next)) {
        if (!this.is_in_check()) moves.push(next); // Not in check (I'm only putting this here, it is the same throughout this function)
        else this.can_block(next, moves); // Can we block
      }
      else if (this.is_capture_valid(next)) {
        moves.push(next);
        break;
      }
      else {
        break;
      }
    }
    // Check all the way right if the path is clear, if it is not check if it is a capture. Get out of the loop as soon as you hit a dead end
    for (let i = this.x + 1; i < 8; i++) {
      const next = [i, this.y];
      if (this.is_square_empty(next)) {
        if (!this.is_in_check()) moves.push(next);
        else this.can_block(next, moves);
      }
      else if (this.is_capture_valid(next)) {
        moves.push(next);
        break;
      }
      else {
        break;
      }
    }
    // Check all the way down if the path is clear, if it is not check if it is a capture. Get out of the loop as soon as you hit a dead end
    for (let i = this.y - 1; i >= 0; i--) {
      const next = [this.x, i];
      if (this.is_square_empty(next)) {
        if (!this.is_in_check()) moves.push(next);
        else this.can_block(next, moves);
      }
      else if (this.is_capture_valid(next)) {
        moves.push(next);
        break;
      }
      else {
        break;
      }
    }
    // Check all the way up if the path is clear, if it is not check if it is a capture. Get out of the loop as soon as you hit a dead end
    for (let i = this.y + 1; i < 8; i++) {
      const next = [this.x, i];
      if (this.is_square_empty(next)) {
        if (!this.is_in_check()) moves.push(next);
        else this.can_block(next, moves);
      }
      else if (this.is_capture_valid(next)) {
        moves.push(next);
        break;
      }
      else {
        break;
      }
    }
    // Return you
    return moves;
  }
}

class Knight extends Pieces {
  // To make one you just need the colour, x, and y. WOW
  constructor(colour, x, y) {
    super("Knight", colour, x, y);
  }

  draw() {
     // WE CAN DRAW IT!!!!
    const image = new Image();
    // What image we put based on the colour
    image.src = this.colour == "black" ? "./images/Black_Knight.png" : "./images/White_Knight.png";
    // Put it in position on load
    image.onload = () => {
      ctx.drawImage(image, (this.x * 100 + 10), (this.y * 100 + 7), 80, 80);
    };
  }

  valid_moves() {
    const moves = [];
    // Here is what the Knight can do given an x and a y
    const movemnet = [
      [-2, -1], [-2, 1],
      [2, -1], [2, 1],
      [-1, -2], [-1, 2],
      [1, -2], [1, 2]
    ];
    // Put down the transformations on the x and y 
    for (let i = 0; i < movemnet.length; i++) {
      const x = this.x + movemnet[i][0];
      const y = this.y + movemnet[i][1];
      // Check if it is in the confinds on the canvas
      if (x >= 0 && x < 8 && y >= 0 && y < 8) {
        const next = [x, y];
        // Check if it is a valid capture or an empty square
        if (this.is_square_empty(next) || this.is_capture_valid(next)) {
          if (!this.can_block(next)) moves.push(next); // Check if it can block a check, we can't allow all moves to go through if the king is in check
        }
      }
    }
    // Return that baby
    return moves;
  }

  can_block(next) {
    // Check if the pawn can block a check for the king but simulating the move and checking
    // if the King is still in check

    // Storing the og x, y and piece (in case if there was a capture)
    const og_x = this.x;
    const og_y = this.y;
    const og_piece = board[next[1]][next[0]];
    // See if that move if good to block a check
    board[this.y][this.x] = null;
    this.x = next[0];
    this.y = next[1];
    board[this.y][this.x] = this;
    // Store the results
    const king_in_check = this.is_in_check();
    // Move back
    board[this.y][this.x] = null;
    this.x = og_x;
    this.y = og_y;
    board[this.y][this.x] = this;
    board[next[1]][next[0]] = og_piece;
    // Return results
    return king_in_check;
  }
}

class Pawn extends Pieces {
  // To make one you just need the colour, x, and y. WOW
  constructor(colour, x, y) {
    super("Pawn", colour, x, y);
    // If En passant is a go, what turn it started and it is capture with en passant
    this.en_passant = false;
    this.en_passant_num = 0;
    this.en_passant_capture = false;
  }

  draw() {
    // WE CAN DRAW IT!!!!
    const image = new Image();
    // What image we put based on the colour 
    image.src = this.colour == "black" ? "./images/Black_Pawn.png" : "./images/White_Pawn.png";
    // Put it in position on load
    image.onload = () => {
      ctx.drawImage(image, (this.x * 100 + 8.4), (this.y * 100 + 7), 80, 80);
    };
  }

  valid_moves() {
    const moves = [];
    // Since pawns can only go one direction, we need to see if we're going up or down
    const direction = this.colour == "black" ? 1 : -1;
    // What is the new position this pawn can go to
    const next = [this.x, this.y + direction];
    // Check if the square is empty and if the king is not in check because if it is we can allow all move to pass by
    if (this.is_square_empty(next)) {
      if (!this.can_block(next)) moves.push(next);
    }
    // Check the en passant moves
    const ep_moves = this.en_passant_moves();
    for (let i = 0; i < ep_moves.length; i++) {
      moves.push(ep_moves[i]);
    }
    // Check if the pawn can double move
    if (this.first_move) {
      const double = [this.x, this.y + 2 * direction];
      // Check the path is clear
      if (this.is_square_empty(double) && this.is_square_empty(next)) {
        if (!this.can_block(double)) {
          moves.push(double);
          // En passant is true for this one
          this.en_passant = true;
          this.en_passant_num = turn_number;
        }
      }
    }
    else {
      // No more true
      this.en_passant = false;
    }
    // Check the captures of the pawn
    const left_capture = [this.x - 1, this.y + direction];
    const right_capture = [this.x + 1, this.y + direction];
    if (this.is_capture_valid(left_capture)) {
      if (!this.can_block(left_capture)) moves.push(left_capture);
    }
    if (this.is_capture_valid(right_capture)) {
      if (!this.can_block(right_capture)) moves.push(right_capture);
    }
    // return the moves array
    return moves;
  }

  en_passant_moves() {
    // We are going to store it in a array
    const moves = [];
    // Which way the pawn is moveing to and what is the enemy colour
    const direction = this.colour == "white" ? -1 : 1;
    const enemy = this.colour == "white" ? "black" : "white";
    // Check if the left en passant capture is valid, if so add it to the arry
    if (this.x > 0 &&
      board[this.y][this.x - 1] != null &&
      board[this.y][this.x - 1].colour == enemy &&
      board[this.y][this.x - 1].type == "Pawn" &&
      board[this.y][this.x - 1].en_passant &&
      board[this.y][this.x - 1].en_passant_num == turn_number - 1
    ) moves.push([this.x - 1, this.y + direction]);
    // Other side now
    if (this.x < 7 &&
      board[this.y][this.x + 1] != null &&
      board[this.y][this.x + 1].colour == enemy &&
      board[this.y][this.x + 1].type == "Pawn" &&
      board[this.y][this.x + 1].en_passant &&
      board[this.y][this.x + 1].en_passant_num == turn_number - 1
    ) moves.push([this.x + 1, this.y + direction]);
    // Return the arry
    return moves;
  }

  can_block(next) {
    // Check if the pawn can block a check for the king but simulating the move and checking
    // if the King is still in check

    // Storing the og x, y and piece (in case if there was a capture)
    const og_x = this.x;
    const og_y = this.y;
    const og_piece = board[next[1]][next[0]];
    // See if that move if good to block a check
    board[this.y][this.x] = null;
    this.x = next[0];
    this.y = next[1];
    board[this.y][this.x] = this;
    // Store the results
    const king_in_check = this.is_in_check();
    // Move back
    board[this.y][this.x] = null;
    this.x = og_x;
    this.y = og_y;
    board[this.y][this.x] = this;
    board[next[1]][next[0]] = og_piece;
    // Return results
    return king_in_check;
  }

  can_promote() {
    // We are just checking if it is on the end rank
    const end_rank = this.colour == "white" ? 0 : 7;
    if (this.y == end_rank) {
      return true; // Good job little pawn
    }
    else return false; // Keep going, almost there
  }
}

// ---------------------------------------------- Class Variables ----------------------------------------------
// We really need these variable
let blackKing = new King("black", 4, 0);
let whiteKing = new King("white", 4, 7);

// ---------------------------------------------- Setup board with data ---------------------------------------
function draw_pieces() {
  // Just draw the pieces
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      // If the piece was not taken and it is a piece
      if (board[i][j] !== null && !board[i][j].is_taken) {
        board[i][j].draw(ctx);
      }
    }
  }
}

// Make the board a chess board
board[0][0] = new Rook("black", 0, 0);
board[0][1] = new Knight("black", 1, 0);
board[0][2] = new Bishop("black", 2, 0);
board[0][3] = new Queen("black", 3, 0);
board[0][4] = blackKing;
board[0][5] = new Bishop("black", 5, 0);
board[0][6] = new Knight("black", 6, 0);
board[0][7] = new Rook("black", 7, 0);
board[1][0] = new Pawn("black", 0, 1);
board[1][1] = new Pawn("black", 1, 1);
board[1][2] = new Pawn("black", 2, 1);
board[1][3] = new Pawn("black", 3, 1)
board[1][4] = new Pawn("black", 4, 1)
board[1][5] = new Pawn("black", 5, 1)
board[1][6] = new Pawn("black", 6, 1)
board[1][7] = new Pawn("black", 7, 1)
//White
board[7][0] = new Rook("white", 0, 7);
board[7][1] = new Knight("white", 1, 7);
board[7][2] = new Bishop("white", 2, 7);
board[7][3] = new Queen("white", 3, 7);
board[7][4] = whiteKing;
board[7][5] = new Bishop("white", 5, 7);
board[7][6] = new Knight("white", 6, 7);
board[7][7] = new Rook("white", 7, 7);
board[6][0] = new Pawn("white", 0, 6)
board[6][1] = new Pawn("white", 1, 6)
board[6][2] = new Pawn("white", 2, 6)
board[6][3] = new Pawn("white", 3, 6)
board[6][4] = new Pawn("white", 4, 6)
board[6][5] = new Pawn("white", 5, 6)
board[6][6] = new Pawn("white", 6, 6)
board[6][7] = new Pawn("white", 7, 6)

// -------------------------------------------- Functions -------------------------------------------------------------
// Draw the pieces
draw_pieces();

function board_setup() {
  // Really just set up the board
  for (let i = 0; i < 8; i++) {
    board[i] = [];
    for (let j = 0; j < 8; j++) {
      // Put null everywhere
      board[i][j] = null;
    }
  }
}

function build_canvas_board() {
  // WOOOOO fun to make the board a chess baord
  ctx.font = "13px Arial"
  // We are putting down the numbers starting with black and ending with white
  let numbers = 8;
  // Start with a "white" square and draw it and then "black"
  ctx.fillStyle = "#C6A992";
  ctx.fillRect(0, 0, 800, 800);
  ctx.fillStyle = "#773F1A";
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j += 2) {
      // Just drawing the black and white squares no biggy
      // If the col is even start with white
      if (i % 2 == 0) {
        ctx.fillRect(((j + 1) * 100), (i * 100), 100, 100);
        // Don't forget to put those number on
        if (j == 0) {
          ctx.fillText(numbers, ((j + 1) * 100 - 95), (i * 100 + 18));
          numbers--;
          // opposite colour
          ctx.fillStyle = "#773F1A";
        }
      }
      // Start with black and put down the number as white
      else {
        ctx.fillRect((j * 100), (i * 100), 100, 100);
        if (j == 0) {
          ctx.fillStyle = "#C6A992";
          ctx.fillText(numbers, ((j + 1) * 100 - 95), (i * 100 + 18));
          numbers--;
          ctx.fillStyle = "#773F1A";
        }
      }
    }
  }
}

function put_letter() {
  // Couldn't put this in the same function as build_cavas_baord but here we go
  ctx.font = "13px Arial"
  // Start at a in the unicode system
  let letters = 97;
  for (let i = 0; i < 8; i++) {
    // We need to make the black and white letter, or brown and coffee colour? I don't really know
    // If it is a even we start with white if odd, start with black
    // Go though this until we get to h
    if (i % 2 == 0) {
      ctx.fillStyle = "#C6A992";
      ctx.fillText(String.fromCharCode(letters), i * 100 + 87, 794);
      ctx.fillStyle = "#773F1A";
      letters++
    }
    else {
      ctx.fillText(String.fromCharCode(letters), i * 100 + 87, 794);
      letters++
    }
  }
}

function show_coords(event) {
  // If the block input is on
  if (!block_input) {
    // Change the x and y to make it in the context of the canvas
    const rect = canvas.getBoundingClientRect()
    // Get where the players clicked on the screen
    let x = Math.floor((event.clientX - rect.left) / 100);
    let y = Math.floor((event.clientY - rect.top) / 100);
    // Just to make it easy on me, the varible
    let currentPiece = board[y][x];
    // Check if the click in in the context of the canvas and if there wasn't a click before this
    if (((x >= 0) && (x <= 7) && (y >= 0) && (y <= 7)) && (selected_piece == null && currentPiece != null && ((currentPiece.colour == "white" && player_turn) || currentPiece.colour == "black" && !player_turn))) {
      // Get ready for the next click
      selected_piece = currentPiece;
      build_canvas_board();
      put_letter();
      draw_pieces();
      // Just make a yellow square on the piece that the player clicked on
      ctx.fillStyle = "rgba(255, 255, 0, 0.3)";
      ctx.fillRect(x * 100, y * 100, 100, 100);
      // Draw the valid moves
      draw_moves(selected_piece);
    }
    // If this is the second click
    else if (selected_piece != null) {
      // If the second click was a valid move 
      if (check_moves(selected_piece, x, y)) {
        // YAY, we made a move now make that move happen

        // These variable are for the promotions so don't worry about it
        piece_to_move = selected_piece;
        piece_to_move_coords = [selected_piece.x, selected_piece.y];
        // Make that move happen
        selected_piece.move(x, y);
        // Make it happen on screen
        build_canvas_board();
        put_letter();
        draw_pieces();
        // Make the first click null
        selected_piece = null;
        // Change whose turn it is and increase turn
        player_turn = !player_turn;
        turn_number++;
        // Start the timer for one player and end it for the other
        start_timer();
        clear_timer();
      }
      // They clicked on another piece so they changed their mind :(
      else if (currentPiece !== null && currentPiece.colour == selected_piece.colour) {
        // Draw everything again and put down that piece they clicked
        build_canvas_board();
        put_letter();
        draw_pieces();
        selected_piece = currentPiece;
        draw_moves(selected_piece);
        ctx.fillStyle = "rgba(255, 255, 0, 0.3)";
        ctx.fillRect(x * 100, y * 100, 100, 100);
      }
      // They made and invalid move D:
      else {
        // Start from the start
        selected_piece = null;
        build_canvas_board();
        put_letter();
        draw_pieces();
      }
    }
    // Just else man. Don't worry about it.
    else {

    }
  }
}

function check_moves(piece, x, y) {
  // Get valid moves of piece
  let valid_moves = piece.valid_moves();
  for (let i = 0; i < valid_moves.length; i++) {
    // If there is a valid move that has the same x and y that we want
    if (valid_moves[i][0] == x && valid_moves[i][1] == y) return true;
  }
  // There wasn't :(
  return false;
}

function draw_moves(piece) {
  // Get the valid moves of the pieces
  let valid_moves = piece.valid_moves();
  // Go throught each valid move
  for (let i = 0; i < valid_moves.length; i++) {
    const x = valid_moves[i][0];
    const y = valid_moves[i][1];
    ctx.beginPath();
    // If the vaild move is a caputre, make a hollow circle
    if (board[y][x] !== null && board[y][x].colour !== piece.colour) {
      ctx.arc(x * 100 + 50, y * 100 + 50, 35, 0, 2 * Math.PI);
      ctx.lineWidth = 10;
      ctx.strokeStyle = "rgba(128, 128, 128, 0.7)";
      ctx.stroke();
    }
    // If it is just a regular move
    else {
      ctx.arc(x * 100 + 50, y * 100 + 50, 15, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(128, 128, 128, 0.7)";
      ctx.fill();
    }
    ctx.closePath();
  }
}

function start_timer() {
  // Just start the timers for each player based on whose turn it is
  if (player_turn) {
    timer1 = setInterval(update_timer, 1000);
  }
  else {
    timer2 = setInterval(update_timer, 1000);
  }
}

function update_timer() {
  // DO NOT UPDATE TIMER IF THE INPUT IS BLOCKED
  if (!block_input) {
    // Check whose turn it is
    if (player_turn) {
      // Count down and change it on screen
      time_1--;
      $("player_1_time").innerHTML = show_time(time_1);
    }
    else {
      // Count down and change it on screen
      time_2--;
      $("player_2_time").innerHTML = show_time(time_2);
    }
    // Lost on time
    if (time_1 <= 0 || time_2 <= 0) {
      clear_timer();
      game_over("time");
    }
  }
}

function clear_timer() {
  // Clear the interval of the time
  // If it's black's clear whites interval and vice versa
  if (!player_turn) {
    clearInterval(timer1);
  }
  else {
    clearInterval(timer2);
  }
}

function show_time(seconds) {
  // Take seconds and make them into minutes
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60; // Whatever you have left is the remaining 
  // Add a 0 if it is below 10
  const add_zero_minutes = (minutes < 10 ? "0" : "") + minutes;
  const add_zero_remainder = (remainder < 10 ? "0" : "") + remainder;
  // Return to be displayed to the screen
  return add_zero_minutes + ":" + add_zero_remainder;
}

function show_pawn_promotion() {
  // Block input
  block_input= true;
  // Make the popout visiable
  $("pawn_promotion").removeAttribute("hidden");
  // Check what colour piece got to the end of the board to display the proper pieces
  if (piece_to_move.colour == "white") {
    $("queen").src = "images/White_Queen.png";
    $("rook").src = "images/White_Rook.png";
    $("bishop").src = "images/White_Bishop.png";
    $("knight").src = "images/White_Knight.png";
  }
  else {
    $("queen").src = "images/Black_Queen.png";
    $("rook").src = "images/Black_Rook.png";
    $("bishop").src = "images/Black_Bishop.png";
    $("knight").src = "images/Black_Knight.png";
  }
}

function pawn_promotion(event) {
  // 
  let button = event.target.id;
  // Get the file and rank becuase we need to do notation of the promotion
  const enemy_king = piece_to_move.colour == "white" ? blackKing : whiteKing;
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
  let promoted_to = ""; // 
  // The start file and the final square
  const initial_file = files[piece_to_move_coords[0]];
  const final_square = files[piece_to_move.x] + ranks[piece_to_move.y];
  let notation = "";
  // Check if the player choose a piece to promote to, and get the start of the pieces letter for notation
  if (button == "queen") {
    board[promoted_piece.y][promoted_piece.x] = null;
    board[promoted_piece.y][promoted_piece.x] = new Queen(promoted_piece.colour, promoted_piece.x, promoted_piece.y);
    promoted_to = "Q";
  }
  else if (button == "rook") {
    board[promoted_piece.y][promoted_piece.x] = null;
    board[promoted_piece.y][promoted_piece.x] = new Rook(promoted_piece.colour, promoted_piece.x, promoted_piece.y);
    promoted_to = "R";
  }
  else if (button == "bishop") {
    board[promoted_piece.y][promoted_piece.x] = null;
    board[promoted_piece.y][promoted_piece.x] = new Bishop(promoted_piece.colour, promoted_piece.x, promoted_piece.y);
    promoted_to = "B";
  }
  else if (button == "knight") {
    board[promoted_piece.y][promoted_piece.x] = null;
    board[promoted_piece.y][promoted_piece.x] = new Knight(promoted_piece.colour, promoted_piece.x, promoted_piece.y);
    promoted_to = "N";
  }
  // If the pawn capture to get promoted, just add the start file and a x
  if (piece_to_move.capture) {
    notation += initial_file + "x";
  }
  // Add to the notation what it is being promoted to
  notation += final_square + "=" + promoted_to;
  // Check is it gave a checkmate, check, or a stalemate
  if (piece_to_move.is_checkmate()) {
    notation += "#";
    game_over(piece_to_move.colour);
  }
  else if (enemy_king.is_in_check()) notation += "+";
  else if (this.is_stalemate(enemy_king.colour)) {
    notation += "$";
    game_over(enemy_king.colour);
  }
  // Out put to the screen the notation
  if (!player_turn) {
    // We also need to output the turn number based on if it was white that just moved
    const turn = Math.round(turn_number / 2);
      $("moveset_turns").innerHTML += turn;
      $("moveset_turns").innerHTML += ". ";
      $("moveset_turns").innerHTML += "<br>";
      $("moveset_white").innerHTML += notation;
      $("moveset_white").innerHTML += " ";
      $("moveset_white").innerHTML += "<br>";
    }
    else {
      $("moveset_black").innerHTML += notation;
      $("moveset_black").innerHTML += "<br>";
    }
  // Draw the board again
  build_canvas_board();
  put_letter();
  draw_pieces();
  $("pawn_promotion").setAttribute("hidden", true);
  // Unblock input
  block_input= false;
}

function start_game() {
  // Hide the start scree and show the moveset chart
  $("start_screen").style.visibility = "hidden";
  $("instruction").style.visibility = "hidden";
  $("moveset_chart").style.visibility = "visible";
  // Unblock input and start the timer to start the game
  block_input = false;
  start_timer();
}

function show_instructions() {
  // Just make the instructions visible
  $("instruction").style.visibility = "visible";
}

function set_time() {
  let choice = $("set_time").value;
  // If player choose 10 min
  if (choice == "10") {
    // 600 seconds in 10 min
    time_1 = 600;
    time_2 = 600;
    // Change the screen to reflect the new time
    $("player_2_time").innerHTML = "10:00";
    $("player_1_time").innerHTML = "10:00";
  }
  // If player choose 5 min
  else if (choice == "5") {
    // 300 seconds in 5 min
    time_1 = 300;
    time_2 = 300;
    // Change the screen to reflect the new time
    $("player_2_time").innerHTML = "05:00";
    $("player_1_time").innerHTML = "05:00";
  }
  // If player choose 3 min
  else if (choice == "3") {
    // 180 seconds in 3 min
    time_1 = 180;
    time_2 = 180;
    // Change the screen to reflect the new time
    $("player_2_time").innerHTML = "03:00";
    $("player_1_time").innerHTML = "03:00";
  }
  // If player choose 1 min
  else if (choice == "1") {
    // 60 seconds in 1 min
    time_1 = 60;
    time_2 = 60;
    // Change the screen to reflect the new time
    $("player_2_time").innerHTML = "01:00";
    $("player_1_time").innerHTML = "01:00";
  }
}

function game_over(colour) {
  // Stop timers
  clear_timer()
  clearInterval(timer1);
  clearInterval(timer2);

  // Block the input from players
  block_input = true;
  // If game was ended not by a timeout
  if (colour !== "time") {
    // Get all the thing one would need to get who has won
    const enemy_colour = colour == "white" ? "black" : "white"
    const enemy_king = colour == "white" ? blackKing : whiteKing;
    const king = colour == "white" ? whiteKing: blackKing;
    $("game_over").style.visibility = "visible";
    // If game won by checkmate, see which colour won
    if (enemy_king.is_checkmate()) {
      $("game_state").innerText = colour.toUpperCase() + " WINS"
      $("game_state").innerHTML += "<br>";
      $("game_state").innerText += "CHECKMATE"
    }
    else if (king.is_checkmate()) {
      $("game_state").innerText = enemy_colour.toUpperCase() + " WINS"
      $("game_state").innerHTML += "<br>";
      $("game_state").innerText += "CHECKMATE"
    }
    // If game ended by stalemate, say a draw
    else if (enemy_king.is_stalemate() || king.is_stalemate()) {
      $("game_state").innerText = "Game Over"
      $("game_state").innerHTML += "<br>";
      $("game_state").innerText += "STALEMATE DRAW"
    }
  }
  // Game was ended by a timeout
  else if (colour == "time") {
    $("game_over").style.visibility = "visible";
    // Check which time ran out and say the winner
    if (time_1 <= 0) {
      $("game_state").innerText = "BLACK WINS"
      $("game_state").innerHTML += "<br>";
      $("game_state").innerText += "TIMEOUT"
    }
    else if (time_2 <= 0) {
      $("game_state").innerText = "WHITE WINS"
      $("game_state").innerHTML += "<br>";
      $("game_state").innerText += "TIMEOUT"
    }
  }
}

function restart_game() {
  // Hide everthing;
  $("game_over").style.visibility = "hidden";
  $("moveset_turns").innerHTML = "";
  $("moveset_white").innerHTML = "";
  $("moveset_black").innerHTML = "";

  // Redo the board to have nothing on it
  board_setup()

  // Reput the variable for the kings
  blackKing = new King("black", 4, 0);
  whiteKing = new King("white", 4, 7);

  // Reput all new classes in their starting place on the board
  //Black
  board[0][0] = new Rook("black", 0, 0);
  board[0][1] = new Knight("black", 1, 0);
  board[0][2] = new Bishop("black", 2, 0);
  board[0][3] = new Queen("black", 3, 0);
  board[0][4] = blackKing;
  board[0][5] = new Bishop("black", 5, 0);
  board[0][6] = new Knight("black", 6, 0);
  board[0][7] = new Rook("black", 7, 0);
  board[1][0] = new Pawn("black", 0, 1);
  board[1][1] = new Pawn("black", 1, 1);
  board[1][2] = new Pawn("black", 2, 1);
  board[1][3] = new Pawn("black", 3, 1);
  board[1][4] = new Pawn("black", 4, 1);
  board[1][5] = new Pawn("black", 5, 1);
  board[1][6] = new Pawn("black", 6, 1);
  board[1][7] = new Pawn("black", 7, 1);
  //White
  board[7][0] = new Rook("white", 0, 7);
  board[7][1] = new Knight("white", 1, 7);
  board[7][2] = new Bishop("white", 2, 7);
  board[7][3] = new Queen("white", 3, 7);
  board[7][4] = whiteKing;
  board[7][5] = new Bishop("white", 5, 7);
  board[7][6] = new Knight("white", 6, 7);
  board[7][7] = new Rook("white", 7, 7);
  board[6][0] = new Pawn("white", 0, 6);
  board[6][1] = new Pawn("white", 1, 6);
  board[6][2] = new Pawn("white", 2, 6);
  board[6][3] = new Pawn("white", 3, 6);
  board[6][4] = new Pawn("white", 4, 6);
  board[6][5] = new Pawn("white", 5, 6);
  board[6][6] = new Pawn("white", 6, 6);
  board[6][7] = new Pawn("white", 7, 6);

  // Reput turn to 1 and make white go first
  player_turn = true;
  turn_number = 1;

  // Redraw board
  build_canvas_board();
  put_letter();
  draw_pieces();

  // Unblock the input
  block_input = false
  
  // Redo the timer
  set_time();
  
}

function end_game() {
  // Just hide the pop out
  $("game_over").style.visibility = "hidden";
}

function $(id) {
  return document.getElementById(id);
}
