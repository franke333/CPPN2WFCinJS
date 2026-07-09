// TODO: Review the generated Doxygen comments in this file manually later.

/**
 * A weighted connection between two CPPN nodes.
 */
class Connection {
	/**
	 * Create a connection between two nodes.
	 *
	 * @param {Node} from The source node.
	 * @param {Node} to The target node.
	 * @param {number} weight The connection weight.
	 */
	constructor(from, to, weight){
		this.fromNode = from; //type: Node
		this.toNode = to; //type: Node
		this.weight = weight; //type: Number
		this.enabled = true;
	}

	/**
	 * Randomly mutate the connection weight.
	 */
	mutateWeight(){ //Randomly mutate the weight of this connection
		let rand = random();
		if (rand < 0.05) //5% chance of being assigned a new random value
			this.weight = random() * 2 - 1;
		else //95% chance of being uniformly perturbed
			this.weight += randomGaussian() / 50;
	}

	/**
	 * Create a copy of this connection.
	 *
	 * @returns {Connection} The cloned connection.
	 */
	clone(){ //Returns a copy of this connection
		let clone = new Connection(this.fromNode, this.toNode, this.weight);
		clone.enabled = this.enabled;
		return clone;
	}

	/**
	 * Compute the innovation number for this connection.
	 *
	 * @returns {number} The innovation number.
	 */
	getInnovationNumber(){ //Using https://en.wikipedia.org/wiki/Pairing_function#Cantor_pairing_function
		return (1/2)*(this.fromNode.number + this.toNode.number)*(this.fromNode.number + this.toNode.number + 1) + this.toNode.number;
	}
}