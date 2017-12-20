Контракт основан на [фреймворке](https://github.com/OpenZeppelin/zeppelin-solidity) от [OpenZeppelin](https://github.com/OpenZeppelin)

### Библиотеки
  [SafeMath](https://github.com/umbrochcho/FirstProject/blob/master/contracts/SafeMath.sol) Безопасные операции с целыми числами в Ethereum

## Интерфейсы
  1. [ERC20 Basic](https://github.com/umbrochcho/FirstProject/blob/master/contracts/ERC20Basic.sol) Базовый стандартный интерфейс токена
  2. [ERC20](https://github.com/umbrochcho/FirstProject/blob/master/ERC20.sol) Расширенный стандартный интерфейс токена
  
## Иерархия контрактов
  1. [Ownable](https://github.com/umbrochcho/FirstProject/blob/master/contracts/Ownable.sol) Обеспечивает некое подобие авторизации, ограничивающее выполнение важных операций только доверенными адресами
  2. [Pausable](https://github.com/umbrochcho/FirstProject/blob/master/contracts/Pausable.sol) Предоставляет возможность полностью прервать все операции контракта в случае необходимости и возобновить их позже.
  3. [AltairVRToken](https://github.com/umbrochcho/FirstProject/blob/master/contracts/BasicToken.sol) Реализация интерфейса [ERC20 Basic](https://github.com/umbrochcho/FirstProject/blob/master/ERC20Basic.sol), обеспечивающая базовые операции с токеном и требования к токену из [whitepaper](https://altair.fm/ico/whitepaper_altairvr_rus.pdf) 
  4. [Burnable Token](https://github.com/umbrochcho/FirstProject/blob/master/contracts/BurnableToken.sol) Расширение функционала токена, позволяющее уменьшать его количество
  5. [Mintable Token](https://github.com/umbrochcho/FirstProject/blob/master/contracts/MintableToken.sol) Расширение функционала токена, позволяющее выпускать новые токены
  6. [Standard Token](https://github.com/umbrochcho/FirstProject/blob/master/contracts/StandardToken.sol) Реализует [ERC20](https://github.com/umbrochcho/FirstProject/blob/master/ERC20.sol) 
  7. [AltairVR](https://github.com/umbrochcho/FirstProject/blob/master/contracts/Crowdsale.sol) Реализует первичное распространение токена [AltairVRToken](https://github.com/umbrochcho/FirstProject/blob/master/BasicToken.sol) в соответствии с [whitepaper](https://altair.fm/ico/whitepaper_altairvr_rus.pdf)  

## Тестирование
  В одном окне консоли запускаем скрипт 
  
  ```
    ./scripts/test.sh
  ```
    
  В другом окне:
  
    если truffle установлен глобально, выполняем команду 
    
    ```
      truffle --network development test ./test/0*.test.js
    ```  
    
    если нет, то выполняем команду 
    
    ```
      ./node_modules/.bin/truffle --network development test ./test/0*.test.js
    ```
    
