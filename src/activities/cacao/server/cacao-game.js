'use strict';

var cloak = require('cloak');

var config = require('../shared/config.json');
var common = require('../../../server/common');
var requirejs = common.createRequireJS({
  shared: '../src/activities/cacao/shared'
});

var PlayerCollection = requirejs('shared/player-collection');
var TxnCollection = require('./txn-collection');

module.exports = CacaoGame;

function CacaoGame() {
  this.players = new PlayerCollection();
  this.pendingTxns = new TxnCollection();
  this.completedTxns = new TxnCollection();
}

CacaoGame.prototype.join = function(user) {
  var lastPlayer = this.players.last();
  var roles = this.players.groupBy('role');
  var buyerCount = roles.buyer && roles.buyer.length || 0;
  var sellerCount = roles.seller && roles.seller.length || 0;
  var role, id, newPlayer;

  if (buyerCount > sellerCount) {
    role = 'seller';
  } else {
    role = 'buyer';
  }

  if (lastPlayer) {
    id = lastPlayer.get('id') + 1;
  } else {
    id = 1;
  }

  newPlayer = this.players.add({
    id: id,
    cloakID: user.id,
    role: role
  });

  user.message('status', newPlayer.toJSON());
};

CacaoGame.prototype.leave = function(user) {
  var player = this.players.findWhere({ cloakID: user.id });
  if (!player) {
    return;
  }

  this.players.remove(player);
};

CacaoGame.prototype.trade = function(txnData, user) {
  var pending = this.pendingTxns.fuzzyFind(txnData);
  var player = this.players.findWhere({ cloakID: user.id });
  var initiator;

  if (!pending) {
    pending = this.pendingTxns.add(txnData);
    pending.set('initiatorID', player.get('id'));
    setTimeout(function() {
      pending.destroy();
      user.message('reject', txnData);
    }, config.txnTimeout);
  } else {
    initiator = this.players.get(pending.get('initiatorID'));

    // Transactions re-submitted by the same player can safely be ignored.
    if (player === initiator) {
      return;
    }

    user.message('accept', txnData);
    cloak.getUser(initiator.get('cloakID')).message('accept', txnData);
    this.completedTxns.add(pending);
  }
};
