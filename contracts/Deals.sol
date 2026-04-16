// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Deals
 * @notice Contrato para registrar acuerdos de compra‑venta entre ganaderos.
 * Solo guarda el "trato final": comprador, vendedor, precio y un metadataUri
 * (JSON en IPFS o similar). El chat, fotos y demás viven off‑chain.
 */
contract Deals {
    enum DealState {
        Pending,   // Creado, aún sin pago
        Paid,      // Pagado en el contrato
        Completed, // Vendedor confirmó entrega, fondos liberados
        Cancelled  // Cancelado antes de completar
    }

    struct Deal {
        address buyer;
        address seller;
        uint256 price;      // Monto en unidades del token (por ej. USDC: 6 decimales)
        address token;      // Dirección del token ERC20 usado (USDC u otro)
        string metadataUri; // URI a JSON con resumen del trato (IDs animales, condiciones, etc.)
        DealState state;
    }

    /// @dev Contador incremental de deals
    uint256 public nextDealId;

    /// @dev dealId => Deal
    mapping(uint256 => Deal) public deals;

    /// @dev Token ERC20 mínimo que necesitamos (balance + transferFrom + transfer)
    interface IERC20 {
        function balanceOf(address account) external view returns (uint256);
        function allowance(address owner, address spender) external view returns (uint256);
        function transfer(address to, uint256 amount) external returns (bool);
        function transferFrom(address from, address to, uint256 amount) external returns (bool);
    }

    event DealCreated(
        uint256 indexed dealId,
        address indexed buyer,
        address indexed seller,
        address token,
        uint256 price,
        string metadataUri
    );

    event DealPaid(uint256 indexed dealId);
    event DealCompleted(uint256 indexed dealId);
    event DealCancelled(uint256 indexed dealId);

    /**
     * @notice Crea un nuevo deal.
     * @param seller Dirección del vendedor.
     * @param token Dirección del token ERC20 (por ejemplo USDC).
     * @param price Monto acordado en unidades del token.
     * @param metadataUri URI al JSON con el detalle del trato.
     *
     * El comprador es msg.sender.
     */
    function createDeal(
        address seller,
        address token,
        uint256 price,
        string calldata metadataUri
    ) external returns (uint256 dealId) {
        require(seller != address(0), "Seller required");
        require(token != address(0), "Token required");
        require(price > 0, "Price must be > 0");
        require(bytes(metadataUri).length > 0, "metadataUri required");

        dealId = nextDealId++;

        deals[dealId] = Deal({
            buyer: msg.sender,
            seller: seller,
            price: price,
            token: token,
            metadataUri: metadataUri,
            state: DealState.Pending
        });

        emit DealCreated(dealId, msg.sender, seller, token, price, metadataUri);
    }

    /**
     * @notice El comprador envía el pago al contrato.
     * Requiere allowance previo del token.
     */
    function payDeal(uint256 dealId) external {
        Deal storage d = deals[dealId];
        require(d.buyer != address(0), "Deal not found");
        require(msg.sender == d.buyer, "Only buyer");
        require(d.state == DealState.Pending, "Invalid state");

        IERC20 token = IERC20(d.token);
        require(token.allowance(msg.sender, address(this)) >= d.price, "Insufficient allowance");

        bool ok = token.transferFrom(msg.sender, address(this), d.price);
        require(ok, "Transfer failed");

        d.state = DealState.Paid;
        emit DealPaid(dealId);
    }

    /**
     * @notice El vendedor confirma la entrega, se liberan los fondos.
     */
    function confirmDelivery(uint256 dealId) external {
        Deal storage d = deals[dealId];
        require(d.buyer != address(0), "Deal not found");
        require(msg.sender == d.seller, "Only seller");
        require(d.state == DealState.Paid, "Invalid state");

        IERC20 token = IERC20(d.token);
        bool ok = token.transfer(d.seller, d.price);
        require(ok, "Payout failed");

        d.state = DealState.Completed;
        emit DealCompleted(dealId);
    }

    /**
     * @notice Cancela un deal pendiente (sin fondos bloqueados).
     * Puede cancelarlo comprador o vendedor mientras esté en Pending.
     */
    function cancelDeal(uint256 dealId) external {
        Deal storage d = deals[dealId];
        require(d.buyer != address(0), "Deal not found");
        require(d.state == DealState.Pending, "Only pending");
        require(msg.sender == d.buyer || msg.sender == d.seller, "Not authorized");

        d.state = DealState.Cancelled;
        emit DealCancelled(dealId);
    }
}

