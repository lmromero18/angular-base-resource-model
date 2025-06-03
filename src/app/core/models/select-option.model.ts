import { BaseResourceService } from "../services/base/base-resource.service";

/**
 * Clase que encapsula la lógica de construcción de opciones para campos <select>,
 * permitiendo usar funciones o claves como `label` y `value`, y aplicar filtros opcionales.
 * Además, implementa un sistema de cache para evitar recomputaciones innecesarias.
 */
export class ModelSelectOption {
    /**
     * Cache interno que almacena las opciones construidas para evitar múltiples evaluaciones.
     */
    private _optionsArrayCache: { label: string; value: any }[] | null = null;

    /**
     * @param label - Nombre de la propiedad o función que define el texto visible en el <option>.
     * @param value - Nombre de la propiedad o función que define el valor del <option>.
     * @param model - Modelo fuente de datos (con `items`) desde donde se obtienen las opciones.
     * @param parentModel - Modelo del formulario padre, útil para aplicar filtros dinámicos.
     * @param filter - Función opcional para filtrar los items del modelo según condiciones personalizadas.
     */
    constructor(
        public label: any,
        public value: any,
        public model: BaseResourceService,
        public parentModel: BaseResourceService,
        public filter?: CallableFunction
    ) { }

    /**
     * Obtiene el texto visible (`label`) para un ítem.
     * Si `label` es una función, se evalúa con el ítem; de lo contrario, se accede como propiedad.
     * @param item - Elemento de datos sobre el cual se evalúa la etiqueta.
     */
    public getName = (item: any) =>
        typeof this.label === "function" ? this.label(item) : item[this.label];

    /**
     * Obtiene el valor (`value`) de un ítem.
     * Si `value` es una función, se evalúa con el ítem; de lo contrario, se accede como propiedad.
     * @param item - Elemento de datos sobre el cual se evalúa el valor.
     */
    public getValue = (item: any) =>
        typeof this.value === "function" ? this.value(item) : item[this.value];

    /**
     * Retorna los elementos del modelo, aplicando el filtro si se proporciona.
     * Si no hay filtro, se devuelven todos los items tal cual están en el modelo.
     */
    public getOptions = () => {
        const allItems = this.model.items;

        if (!this.filter) return allItems;

        const parentInputs = this.parentModel.getFormInputs();

        return allItems.filter((item, index) =>
            this.filter!(item, parentInputs, index)
        );
    };

    /**
     * Devuelve un arreglo de objetos `{ label, value }` listos para usar en un <select>.
     * Este resultado se cachea internamente para evitar reevaluaciones innecesarias.
     */
    public getOptionsAsArray = () => {
        if (!this._optionsArrayCache) {
            const options = this.getOptions();
            this._optionsArrayCache = options.map((item) => ({
                label: this.getName(item),
                value: this.getValue(item),
            }));
        }
        return this._optionsArrayCache;
    };

    /**
     * Limpia el cache de opciones formateadas.
     * Llamar a esta función obliga a reconstruir las opciones en la siguiente llamada a `getOptionsAsArray()`.
     */
    public clearCache() {
        this._optionsArrayCache = null;
    }
}
