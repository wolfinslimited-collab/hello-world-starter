-- Deactivate TRON network since AsterDEX does not support it
-- Only EVM (ETH, BSC, Arbitrum) and Solana are supported
UPDATE networks 
SET is_active = false 
WHERE chain = 'tron';

-- Also deactivate all asset_networks that use TRON
UPDATE asset_networks 
SET is_active = false, can_deposit = false, can_withdraw = false
WHERE network_id = (SELECT id FROM networks WHERE chain = 'tron');

-- Add a comment to document supported networks
COMMENT ON TABLE networks IS 'Blockchain networks. AsterDEX supports: EVM (ETH chainId:1, BSC chainId:56, Arbitrum chainId:42161) and Solana (chainId:101). TRON is NOT supported.';