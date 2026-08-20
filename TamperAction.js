/*

  

*/

class TamperAction {
    static tamperWindow = null;
  /**
   * Crée une instance de TamperAction.
   * @param {number} beforeDelay - Délai initial en millisecondes avant l'action.
   * @param {number} afterDelay - Délai final en millisecondes après l'action.
   */
  constructor(action, beforeDelay = 0, afterDelay = 0, beforeFunction = null, afterFunction = null) {
     this.action = action;
     this.beforeDelay = beforeDelay;
     this.beforeFunction = beforeFunction;
     this.afterDelay = afterDelay;
     this.afterFunction = afterFunction;
      switch (typeof(action)) {
          case 'object':
             Object.keys(action).forEach(key=>{ this[key] = action[key];})
             break;
        default:
            // Par defaut, this.action est une fonction.
          break;
      }
  }

  static log(data) {
      const now = new Date().toLocaleTimeString();
      console.log (`%c[${now}]`, 'color: green;');
      console.log (data);

      if (this.tamperWindow === false) return;

      if (this.tamperWindow === null || this.tamperWindow === undefined) {
          this.tamperWindow = document.querySelector('tamper-window');
      }

      if (this.tamperWindow) {
          this.tamperWindow.log (data);
      } else {
          this.tamperWindow = false;
      }
  }

  /**
   * Attend un délai spécifié.
   * @param {number} delay - Délai en millisecondes.
   * @returns {Promise<void>}
   */
  async wait(delay) {
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Attend qu'une fonction de condition renvoie 'true', en réessayant après un délai.
   * @param {Function} conditionFunction - Fonction à tester (peut être async).
   * @param {*} arg - Argument éventuellement passé à la fonction de condition.
   * @param {number} delay - Délai entre chaque tentative.
   * @returns {Promise<void>}
   */
  async waitUntil(conditionFunction, arg, delay) {
      return new Promise((resolve) => {
          const check = async () => {
              if (await conditionFunction(arg)) {
                  resolve();
              } else {
                  await this.wait(delay);
                  check();
              }
          };
          check();
      });
  }

  /**
   * Exécute une action après un délai initial, puis attend un délai final.
   * @param {Function} action - Fonction à exécuter.
   * @returns {Promise<void>}
   */
  async run(...args) {
    await this.wait(this.beforeDelay);
    if (this.beforeFunction) { // Si this.beforeFunction est définie, on attend qu'elle renvoie 'true' avant d'exécuter l'action
        await this.waitUntil(this.beforeFunction, undefined, this.beforeDelay);
    }

    let retour = this.action(...args);
    
    await this.wait(this.afterDelay);
    if (this.afterFunction) { // Si this.afterFunction est définie, on attend que cette dernière renvoie 'true'
        await this.waitUntil(this.afterFunction, retour, this.afterDelay);
    }
    return retour;
  }
}
