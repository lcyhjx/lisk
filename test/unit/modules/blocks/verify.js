'use strict';

var chai = require('chai');
var expect = require('chai').expect;

var express = require('express');
var sinon = require('sinon');

var modulesLoader = require('../../../common/initModule').modulesLoader;
var BlockLogic = require('../../../../logic/block.js');
var exceptions = require('../../../../helpers/exceptions.js');
var crypto = require('crypto');

var previousBlock = {
	blockSignature:'696f78bed4d02faae05224db64e964195c39f715471ebf416b260bc01fa0148f3bddf559127b2725c222b01cededb37c7652293eb1a81affe2acdc570266b501',
	generatorPublicKey:'86499879448d1b0215d59cbf078836e3d7d9d2782d56a2274a568761bff36f19',
	height:488,
	id:'6524861224470851795',
	numberOfTransactions:0,
	payloadHash:'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
	payloadLength:0,
	previousBlock:'8805727971083409014',
	relays:1,
	reward:0,
	timestamp:32578360,
	totalAmount:0,
	totalFee:0,
	transactions: [],
	version:0,
};

var validBlockReward = {
	blockSignature: 'b626ff71d01ec0ce1f700253f11ea708c6d505e8613f94d42f4e21572d062ce8732169b14c515c201bbc0d21cf57329ea8ffc65608b263f8d54a985af8bb2e09',
	generatorPublicKey: 'c76a0e680e83f47cf07c0f46b410f3b97e424171057a0f8f0f420c613da2f7b5',
	numberOfTransactions: 1,
	payloadHash: '215020db61a29a640397e39a2766fc467f7d12c95e814a5f6b150d562e6088ad',
	payloadLength: 117,
	previousBlock: '6524861224470851795',
	reward: 999,
	timestamp: 32578370,
	totalAmount: 10000000000000000,
	totalFee: 10000000,
	transactions: [
		{
			'type': 0,
			'amount': 10000000000000000,
			'fee': 10000000,
			'timestamp': 33514086,
			'recipientId': '16313739661670634666L',
			'senderId': '2737453412992791987L',
			'senderPublicKey': 'c76a0e680e83f47cf07c0f46b410f3b97e424171057a0f8f0f420c613da2f7b5',
			'signature': '57bc34c092189e6520b1fcb5b8a1e911d5aed56910ae75d8bbf6145b780dce539949ba86a0ae8d6a33b3a2a68ce8c16eb39b448b4e53f5ca8b04a0da3b438907',
			'id': '7249285091378090017'
		}
	],
	version: 0,
	id: '2783858589203451895'
};

var testAccount = {
	account: {
		username: 'test_verify',
		isDelegate: 1,
		address: '2737453412992791987L',
		publicKey: 'c76a0e680e83f47cf07c0f46b410f3b97e424171057a0f8f0f420c613da2f7b5',
		balance: 5300000000000000000,
	},
	secret: 'message crash glance horror pear opera hedgehog monitor connect vague chuckle advice',
};

var userAccount = {
	account: {
		username: 'test_verify_user',
		isDelegate: 0,
		address: '2896019180726908125L',
		publicKey: '684a0259a769a9bdf8b82c5fe3054182ba3e936cf027bb63be231cd25d942adb',
		balance: 0,
	},
	secret: 'joy ethics cruise churn ozone asset quote renew dutch erosion seed pioneer',
};

var validBlock1;
var transactionsValidBlock1 =	[
	{
		'type': 0,
		'amount': 10000000000000000,
		'fee': 10000000,
		'timestamp': 33514086,
		'recipientId': '16313739661670634666L',
		'senderId': '2737453412992791987L',
		'senderPublicKey': 'c76a0e680e83f47cf07c0f46b410f3b97e424171057a0f8f0f420c613da2f7b5',
		'signature': '57bc34c092189e6520b1fcb5b8a1e911d5aed56910ae75d8bbf6145b780dce539949ba86a0ae8d6a33b3a2a68ce8c16eb39b448b4e53f5ca8b04a0da3b438907',
		'id': '7249285091378090017'
	}
];

var validBlock2;
var transactionsValidBlock2 = [
	{
		'type': 0,
		'amount': 100000000,
		'fee': 10000000,
		'timestamp': 33772862,
		'recipientId': '16313739661670634666L',
		'senderId': '2737453412992791987L',
		'senderPublicKey': 'c76a0e680e83f47cf07c0f46b410f3b97e424171057a0f8f0f420c613da2f7b5',
		'signature': 'd2b2cb8d09169bf9f22ef123361036ae096ad71155fc3afddc7f22d4118b56a949fb82ff12fd6e6a05f411fe7e9e7877f71989959f895a6de94c193fe078f80b',
		'id': '15250193673472372402'
	}
];

var validBlock3;
var transactionsValidBlock3 = [
	{
		'type': 0,
		'amount': 100000000,
		'fee': 10000000,
		'timestamp': 33942637,
		'recipientId': '2896019180726908125L',
		'senderId': '2737453412992791987L',
		'senderPublicKey': 'c76a0e680e83f47cf07c0f46b410f3b97e424171057a0f8f0f420c613da2f7b5',
		'signature': '2e2fb92c17716f2e239148fc990cb712b76639301c945050b621d7568c781f1ad49991b173fff9e7fc8348818ac606d4069cf78ce2b873d86f48da37a4bf5f07',
		'id': '5602023031121962294'
	}
];

function createBlock (blocksModule, blockLogic, secret, timestamp, transactions, previousBlock) {
	var keypair = blockLogic.scope.ed.makeKeypair(crypto.createHash('sha256').update(secret, 'utf8').digest());
	blocksModule.lastBlock.set(previousBlock);
	var newBLock = blockLogic.create({
		keypair: keypair,
		timestamp: timestamp,
		previousBlock: blocksModule.lastBlock.get(),
		transactions: transactions
	});
	newBLock.id = blockLogic.getId(newBLock);
	return newBLock;
}

describe('blocks/verify', function () {

	var blocksVerify;
	var blocks;
	var blockLogic;
	var accounts;
	before(function (done) {
		modulesLoader.initLogic(BlockLogic, modulesLoader.scope, function (err, __blockLogic) {
			if (err) {
				return done(err);
			}			
			blockLogic = __blockLogic;

			modulesLoader.initModules([
				{blocks: require('../../../../modules/blocks')},
				{accounts: require('../../../../modules/accounts')},
				{delegates: require('../../../../modules/delegates')},
				{transactions: require('../../../../modules/transactions')},
				{rounds: require('../../../../modules/rounds')},
				{transport: require('../../../../modules/transport')},
				{system: require('../../../../modules/system')},
			], [
				{'block': require('../../../../logic/block')},
				{'transaction': require('../../../../logic/transaction')},
				{'account': require('../../../../logic/account')},
			], {}, function (err, __blocks) {
				if (err) {
					return done(err);
				}
				__blocks.blocks.verify.onBind(__blocks);
				__blocks.delegates.onBind(__blocks);
				__blocks.transactions.onBind(__blocks);
				__blocks.blocks.chain.onBind(__blocks);
				__blocks.rounds.onBind(__blocks);
				__blocks.transport.onBind(__blocks);
				blockLogic.scope.transaction.bindModules(__blocks.rounds);
				blocks = __blocks.blocks;
				blocksVerify = __blocks.blocks.verify;
				accounts = __blocks.accounts;
				done();
			});
		});
	});

	describe('verifyBlock() for valid block', function () {

		it('should create a block 1', function (done) {
			var secret = 'famous weapon poverty blast announce observe discover prosper mystery adapt tuna office';
			
			validBlock1 = createBlock(blocks, blockLogic, secret, 32578370, transactionsValidBlock1, previousBlock);
			expect(validBlock1.version).to.equal(0);
			done();
		});
		
		it('should be ok', function (done) {
			
			var check = blocksVerify.verifyBlock(validBlock1);
			expect(check).to.equal('verified');
			done();
		});
		
		it('rewards should be ok for blockRewards exception', function (done) {
			exceptions.blockRewards.push(validBlockReward.id);
			
			var check = blocksVerify.verifyBlock(validBlockReward);
			expect(check).to.equal('verified');
			done();
		});
	});

	describe('verifyBlock() for invalid block', function () {
		var invalidBlock, invalidPreviousBlock;

		it('should load invalid info', function (done) {
			invalidBlock = JSON.parse(JSON.stringify(validBlock1));
			invalidPreviousBlock = JSON.parse(JSON.stringify(previousBlock));
			done();
		});

		it('verify block id should fail (invalid block id)', function (done) {
			invalidBlock.id = 'invalid-block-id';

			var check = blocksVerify.verifyBlock(invalidBlock);
			expect(check).to.equal('Invalid block id');
			done();
		});

		it('verify block signature should fail (invalid blockSignature: no hex)', function (done) {
			invalidBlock.blockSignature = 'invalidblocksignature';

			var check = blocksVerify.verifyBlock(invalidBlock);
			expect(check).to.equal('TypeError: Invalid hex string');
			done();
		});

		it('verify block signature should fail (invalid blockSignature: hex)', function (done) {
			invalidBlock.blockSignature = 'bfaaabdc8612e177f1337d225a8a5af18cf2534f9e41b66c114850aa50ca2ea2621c4b2d34c4a8b62ea7d043e854c8ae3891113543f84f437e9d3c9cb24c0e05';

			var check = blocksVerify.verifyBlock(invalidBlock);
			expect(check).to.equal('Failed to verify block signature');
			done();
		});

		it('verify block signature should fail (invalid generatorPublicKey: no hex)', function (done) {
			invalidBlock.blockSignature = validBlock1.blockSignature;
			invalidBlock.generatorPublicKey = 'invalidblocksignature';

			var check = blocksVerify.verifyBlock(invalidBlock);
			expect(check).to.equal('TypeError: Invalid hex string');
			done();
		});		

		it('verify block signature should fail (invalid generatorPublicKey: hex)', function (done) {
			invalidBlock.generatorPublicKey = '948b8b509579306694c00db2206ddb1517bfeca2b0dc833ec1c0f81e9644871b';

			var check = blocksVerify.verifyBlock(invalidBlock);
			expect(check).to.equal('Failed to verify block signature');
			done();
		});

		it('calculate expected rewards should fail (invalid reward)', function (done) {
			invalidBlock.reward = 555;

			var check = blocksVerify.verifyBlock(invalidBlock);
			expect(check).to.equal(['Invalid block reward:', invalidBlock.reward, 'expected:', validBlock1.reward].join(' '));
			done();
		});
		
		it('total fee should fail (invalid total fee)', function (done) {
			invalidBlock.totalFee = 555;

			var check = blocksVerify.verifyBlock(invalidBlock);
			expect(check).to.equal('Invalid total fee');
			done();
		});
		
		it('payloadHash should fail (invalid payload hash)', function (done) {
			invalidBlock.payloadHash = 'invalidpayloadhash';

			var check = blocksVerify.verifyBlock(invalidBlock);
			expect(check).to.equal('Invalid payload hash');
			done();
		});

		it('transactions check should fail (duplicate transaction)', function (done) {
			invalidBlock.transactions.push(invalidBlock.transactions[0]);
			invalidBlock.numberOfTransactions = 2;
			
			var check = blocksVerify.verifyBlock(invalidBlock);
			expect(check).to.equal('Encountered duplicate transaction: ' + invalidBlock.transactions[1].id);
			done();
		});

		it('transactions check should fail (getBytes(): Unknown transaction type)', function (done) {
			invalidBlock.transactions[0].type = 555;

			var check = blocksVerify.verifyBlock(invalidBlock);
			expect(check).to.equal('Unknown transaction type ' + invalidBlock.transactions[0].type);
			done();
		});

		it('transactions check should fail (length is too high)', function (done) {
			invalidBlock.transactions[0].type = validBlock1.transactions[0].type;
			invalidBlock.transactions = new Array(26);
			invalidBlock.numberOfTransactions = invalidBlock.transactions.length;
			
			var check = blocksVerify.verifyBlock(invalidBlock);
			expect(check).to.equal('Transactions length is too high');
			done();
		});

		it('transactions check should fail (number of transactions)', function (done) {
			invalidBlock.transactions = validBlock1.transactions;
			
			var check = blocksVerify.verifyBlock(invalidBlock);
			expect(check).to.equal('Invalid number of transactions');
			done();
		});

		it('payload length should fail (too high)', function (done) {
			invalidBlock.payloadLength = 1024 * 1024 * 2;

			var check = blocksVerify.verifyBlock(invalidBlock);
			expect(check).to.equal('Payload length is too high');
			done();
		});

		it('previous block should fail (fork:1)', function (done) {
			invalidBlock.previousBlock = '10937893559311260102';
			invalidBlock.id = '10937893559311260102';

			var check = blocksVerify.verifyBlock(invalidBlock);
			expect(check).to.equal(['Invalid previous block:', invalidBlock.previousBlock, 'expected:', previousBlock.id].join(' '));
			done();
		});

		it('previous block should fail', function (done) {
			delete invalidPreviousBlock.previousBlock;
			invalidPreviousBlock.timestamp = 32578380;
			blocks.lastBlock.set(previousBlock);

			var check = blocksVerify.verifyBlock(invalidPreviousBlock);
			expect(check).to.equal('Invalid previous block');
			done();
		});

		it('block timestamp should fail', function (done) {
			invalidPreviousBlock.timestamp = 32578350;

			var check = blocksVerify.verifyBlock(invalidPreviousBlock);
			expect(check).to.equal('Invalid block timestamp');
			done();
		});

		it('block version should fail', function (done) {
			invalidPreviousBlock.version = 555;

			var check = blocksVerify.verifyBlock(invalidPreviousBlock);
			expect(check).to.equal('Invalid block version');
			done();
		});
	});
	
	// Sends a block to network, save it locally.
	describe('processBlock() for valid block {broadcast: true, saveBlock: true}', function () {
		
		it('should generate new account', function (done) {
			accounts.setAccountAndGet(testAccount.account, function (err, newaccount) {
				if (err) {
					return done(err);
				}
				expect(newaccount.address).to.equal(testAccount.account.address);
				done();
			});
		});

		it('should processBlock ok', function (done) {

			blocksVerify.processBlock(validBlock1, true, function (err, result) {
				if (err) {
					return done(err);
				}
				expect(result).to.be.undefined;
				var onMessage = modulesLoader.scope.bus.getMessages();
				expect(onMessage[0]).to.equal('newBlock');
				expect(onMessage[1].version).to.be.undefined;
				expect(onMessage[1].numberOfTransactions).to.be.undefined;
				expect(onMessage[1].id).to.equal(validBlock1.id);
				expect(onMessage[2]).to.be.true;
				expect(onMessage[3]).to.equal('transactionsSaved');
				expect(onMessage[4][0].id).to.equal(validBlock1.transactions[0].id);
				modulesLoader.scope.bus.clearMessages();
				done();
			}, true);
		});
	});

	describe('processBlock() for invalid block {broadcast: true, saveBlock: true}', function () {
		
		it('process same block again should fail (checkExists)', function (done) {
			blocks.lastBlock.set(previousBlock);

			blocksVerify.processBlock(validBlock1, true, function (err, result) {
				expect(err).to.equal(['Block', validBlock1.id, 'already exists'].join(' '));
				done();
				modulesLoader.scope.bus.clearMessages();
			}, true);
		});
	});
	
	// Receives a block from network, save it locally.
	describe('processBlock() for invalid block {broadcast: false, saveBlock: true}', function () {
		
		var invalidBlock2;

		it('should generate valid block2', function (done) {
			var secret = 'flip relief play educate address plastic doctor fix must frown oppose segment';
			validBlock2 = createBlock(blocks, blockLogic, secret, 33772862, transactionsValidBlock2, validBlock1);
			expect(validBlock2.version).to.equal(0);
			done();
		});
	
		it('normalizeBlock should fail (block schema: timestamp)', function (done) {
			invalidBlock2 = JSON.parse(JSON.stringify(validBlock2));
			delete invalidBlock2.timestamp;

			blocksVerify.processBlock(invalidBlock2, false, function (err, result) {
				if (err) {
					expect(err).equal('Failed to validate block schema: Missing required property: timestamp');
					done();
				}
			}, true);
		});

		it('normalizeBlock should fail (block schema: transactions)', function (done) {
			invalidBlock2.timestamp = validBlock2.timestamp;
			delete invalidBlock2.transactions;

			blocksVerify.processBlock(invalidBlock2, false, function (err, result) {
				if (err) {
					expect(err).equal('Failed to validate block schema: Missing required property: transactions');
					done();
				}
			}, true);
		});

		it('normalizeBlock should fail (transaction schema: type)', function (done) {
			invalidBlock2.transactions = JSON.parse(JSON.stringify(validBlock2.transactions));
			delete invalidBlock2.transactions[0].type;

			blocksVerify.processBlock(invalidBlock2, false, function (err, result) {
				if (err) {
					expect(err).equal('Unknown transaction type undefined');
					done();
				}
			}, true);
		});

		it('normalizeBlock should fail (transaction schema: timestamp)', function (done) {
			invalidBlock2.transactions[0].type = validBlock2.transactions[0].type;
			delete invalidBlock2.transactions[0].timestamp;

			blocksVerify.processBlock(invalidBlock2, false, function (err, result) {
				if (err) {
					expect(err).equal('Failed to validate transaction schema: Missing required property: timestamp');
					done();
				}
			}, true);
		});

		it('validateBlockSlot should fail (fork: 3)', function (done) {
			invalidBlock2.transactions[0].timestamp = validBlock2.transactions[0].timestamp;
			invalidBlock2.generatorPublicKey = 'invalid-public-key';
			
			blocksVerify.processBlock(invalidBlock2, false, function (err, result) {
				if (err) {
					expect(err).equal('Failed to validate block schema: Object didn\'t pass validation for format publicKey: invalid-public-key');
					done();
				}
			}, true);
		});

		it('checkTransactions should fail (trs in table)', function (done) {
			var secret = 'fortune project stable road outside spoil team quantum journey fall cloud great';
			validBlock2.height = 489;
			var invalidBlock3 = createBlock(blocks, blockLogic, secret, 33772874, transactionsValidBlock1, validBlock2);

			blocksVerify.processBlock(invalidBlock3, false, function (err, result) {
				if (err) {
					expect(err).to.equal(['Transaction is already confirmed:', transactionsValidBlock1[0].id].join(' '));
					done();
				}
			}, true);
		});
	});

	describe('processBlock() for valid block {broadcast: false, saveBlock: true}', function () {

		it('should be ok', function (done) {
			blocks.lastBlock.set(validBlock1);

			blocksVerify.processBlock(validBlock2, false, function (err, result) {
				if (err) {
					return done(err);
				}
				expect(result).to.be.undefined;
				var onMessage = modulesLoader.scope.bus.getMessages();
				expect(onMessage[0]).to.equal('transactionsSaved');
				expect(onMessage[1][0].id).to.equal(validBlock2.transactions[0].id);
				modulesLoader.scope.bus.clearMessages();
				done();
			}, true);
		});

		it('process same block again should fail (checkExists)', function (done) {
			blocks.lastBlock.set(validBlock1);
			
			blocksVerify.processBlock(validBlock2, false, function (err, result) {
				expect(err).to.equal(['Block', validBlock2.id, 'already exists'].join(' '));
				done();
			}, true);
		});
	});

	// Sends a block to network, don't save it locally.
	describe('processBlock() for valid block {broadcast: true, saveBlock: false}', function () {

		it('should generate a new account (user)', function (done) {
			accounts.setAccountAndGet(userAccount.account, function (err, newaccount) {
				if (err) {
					return done(err);
				}
				expect(newaccount.address).to.equal(userAccount.account.address);
				done();
			});
		});
		it('should generate valid block3', function (done) {
			var secret = 'flavor type stone episode capable usage save sniff notable liar gas someone';
			validBlock3 = createBlock(blocks, blockLogic, secret, 33942637, transactionsValidBlock3, validBlock2);
			expect(validBlock3.version).to.equal(0);
			done();
		});

		it('processBlock() should broadcast block3', function (done) {

			blocksVerify.processBlock(validBlock3, true, function (err, result) {
				if (err) {
					return done(err);
				}
				expect(result).to.be.undefined;
				var onMessage = modulesLoader.scope.bus.getMessages();
				expect(onMessage[0]).to.equal('newBlock');
				expect(onMessage[1].version).to.be.undefined;
				expect(onMessage[1].numberOfTransactions).to.be.undefined;
				expect(onMessage[1].id).to.equal(validBlock3.id);
				expect(onMessage[2]).to.be.true;
				expect(onMessage[3]).to.be.undefined; // transactionsSaved
				modulesLoader.scope.bus.clearMessages();
				done();
			}, false);
		});

		it('processBlock() broadcast block3 again should be ok (checkExists)', function (done) {
			blocks.lastBlock.set(validBlock2);
			
			blocksVerify.processBlock(validBlock3, true, function (err, result) {
				if (err) {
					return done(err);
				}
				expect(result).to.be.undefined;
				var onMessage = modulesLoader.scope.bus.getMessages();
				expect(onMessage[0]).to.equal('newBlock');
				expect(onMessage[1].version).to.be.undefined;
				expect(onMessage[1].numberOfTransactions).to.be.undefined;
				expect(onMessage[1].id).to.equal(validBlock3.id);
				expect(onMessage[2]).to.be.true;
				expect(onMessage[3]).to.be.undefined; // transactionsSaved
				modulesLoader.scope.bus.clearMessages();
				done();
			}, false);
		});

	});

	// Receives a block from network, don't save it locally.
	describe('processBlock() for valid block {broadcast: false, saveBlock: false}', function () {

		it('processBlock() should receive block3', function (done) {
			blocks.lastBlock.set(validBlock2);

			blocksVerify.processBlock(validBlock3, false, function (err, result) {
				if (err) {
					return done(err);
				}
				expect(result).to.be.undefined;
				var onMessage = modulesLoader.scope.bus.getMessages();
				expect(onMessage).to.be.an('array').that.is.empty;
				done();
			}, false);
		});

		it('processBlock() receive block3 again should be ok (checkExists)', function (done) {
			blocks.lastBlock.set(validBlock1);
			
			blocksVerify.processBlock(validBlock2, false, function (err, result) {
				expect(result).to.be.undefined;
				var onMessage = modulesLoader.scope.bus.getMessages();
				expect(onMessage).to.be.an('array').that.is.empty;
				done();
			}, false);
		});
	});
});