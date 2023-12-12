export default class Abiotic {
  id: number;
  description: string;
  unit: string;
  max: number;
  min: number;

  constructor(data: {
    id: number;
    description: string;
    unit: string;
    max: number;
    min: number;
  }) {
    this.id = data.id;
    this.description = data.description;
    this.unit = data.unit;
    this.max = data.max;
    this.min = data.min;
    return this;
  }
}
