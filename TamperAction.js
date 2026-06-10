/*

  

*/

class TamperAction {
    static tamperWindow = null;
  /**
   * Crée une instance de TamperAction.
   * @param {number} beforeDelay - Délai initial en millisecondes avant l'action.
   * @param {number} afterDelay - Délai final en millisecondes après l'action.
   */
  constructor(action, beforeDelay = 0, afterDelay = 0, afterFunction = null) {
      switch (typeof(action)) {
          case 'function':
             this.action = action;
             this.beforeDelay = beforeDelay;
             this.afterDelay = afterDelay;
             break;
          case 'object':
             Object.keys(action).forEach(key=>{ this[key] = action[key];})
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
   * Exécute une action après un délai initial, puis attend un délai final.
   * @param {Function} action - Fonction à exécuter.
   * @returns {Promise<void>}
   */
  async run() {
    await this.wait(this.beforeDelay);
    let retour = this.action();
    await this.wait(this.afterDelay);
      if (this.afterFunction) {
          await new Promise((resolve) => {
              const check = async () => {
                  if (await this.afterFunction(retour)) {
                      resolve();
                  } else {
                      await this.wait(this.afterDelay);
                      check();
                  }
              };
              check();
          });
      }
      return retour;
  }
}
