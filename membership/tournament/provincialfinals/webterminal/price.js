  const orderTypeSelector = document.getElementById('orderType');
  const priceInputContainer = document.getElementById('priceInputContainer');

  orderTypeSelector.addEventListener('change', () => {
    const selected = orderTypeSelector.value;
    const showInput = ['buy_stop', 'sell_stop', 'buy_limit', 'sell_limit'].includes(selected);
    priceInputContainer.style.display = showInput ? 'block' : 'none';
  });