const { assert } = require('chai');

const Tether = artifacts.require('Tether');
const RWD = artifacts.require('RWD');
const DecentralBank = artifacts.require('DecentralBank');

require('chai')
.use(require('chai-as-promised'))
.should();

contract('DecentralBank', ([owner, customer]) => {
    let tether, rwd, decentralBank;

    function tokens(number) {
        return web3.utils.toWei(number, 'ether');
    }

    before(async () =>{
        //Load contracts
        tether = await Tether.new();
        rwd = await RWD.new();
        decentralBank = await DecentralBank.new(rwd.address, tether.address);

        //Transfer all tokens to DecentralBank (1 million);
        await rwd.transfer(decentralBank.address, tokens('1000000'));

        //Transfer 100 mock Tether to customer
        await tether.transfer(customer, tokens('100'), {from: owner})
    })

    describe('Mock Tether Deployment', async() => {
        it('matches tether name successfully', async() => {
            const name = await tether.name();
            assert.equal(name, 'Tether');
        });

        it('matches rwd name successfully', async() => {
            const name = await rwd.name();
            assert.equal(name, 'Reward Token');
        });
    });

    describe('Decentral bank deployment', async() => {
        it('contract has tokens', async() => {
            let balance = await rwd.balanceOf(decentralBank.address);
            assert.equal(balance, tokens('1000000'));
        });
    });

    describe('Yield Farming', async() => {
        it('reward tokens for staking', async() => {
            let result;
            //check investor balance
            result = await tether.balanceOf(customer);
            assert.equal(result.toString(), tokens('100', 'investor mock tether balance before stakeing'));

            //Check staking for customer of 100 tokens
            await tether.approve(decentralBank.address, tokens('100'), {from: customer});
            await decentralBank.depositTokens(tokens('100'), {from: customer});

            //Check updated balance of customer
            result = await tether.balanceOf(customer);
            assert.equal(result.toString(), tokens('0', 'investor mock tether balance after stakeing'));

            //Check updated balance of central bank
            result = await tether.balanceOf(decentralBank.address);
            assert.equal(result.toString(), tokens('100', 'decentralBank mock wallet after before stakeing'));

            //Is staking balance
            result = await decentralBank.isStaking(customer);
            assert.equal(result.toString(), 'true', 'customer is staking status after staking');

            //Issue tokens
            await decentralBank.issueTokens({from: owner});

            //Ensure only owner can issue tokens
            await decentralBank.issueTokens({from: customer}).should.be.rejected;

            // Unstake Tokens
            await decentralBank.unstakeTokens({from: customer})

            // Check Unstaking Balances

            result = await tether.balanceOf(customer)
            assert.equal(result.toString(), tokens('100'), 'customer mock wallet balance after unstaking')     
                        
            // Check Updated Balance of Decentral Bank
            result = await tether.balanceOf(decentralBank.address)
            assert.equal(result.toString(), tokens('0'), 'decentral bank mock wallet balance after staking from customer')     
            
            // Is Staking Update
            result = await decentralBank.isStaking(customer)
            assert.equal(result.toString(), 'false', 'customer is no longer staking after unstaking')

        });

    })
}); 