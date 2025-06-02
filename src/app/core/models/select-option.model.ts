import { BaseResourceService } from "../services/base-resource.service";

export class ModelSelectOption {
    constructor(
        public label: any,
        public value: any,
        public model: BaseResourceService,
        public parentModel: BaseResourceService,
        public filter?: CallableFunction
    ) { }

    public getName = (item: any) =>
        typeof this.label === "function" ? this.label(item) : item[this.label];

    public getValue = (item: any) =>
        typeof this.value === "function" ? this.value(item) : item[this.value];

    public getOptions = () => {
        const allItems = this.model.items;

        if (!this.filter) {
            return allItems;
        }

        const parentInputs = this.parentModel.getFormInputs();

        return allItems.filter((item, index) =>
            this.filter!(item, parentInputs, index)
        );
    };

    public getOptionsAsArray = () => {
        return this.getOptions().map((item) => ({
            label: this.getName(item),
            value: this.getValue(item),
        }));
    };

}
