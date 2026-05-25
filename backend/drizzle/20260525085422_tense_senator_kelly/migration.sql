CREATE TABLE [room_states] (
	[room_id] nvarchar(450),
	[key] nvarchar(450),
	[state] nvarchar(max) NOT NULL CONSTRAINT [room_states_state_default] DEFAULT ('{}'),
	CONSTRAINT [room_states_pkey] PRIMARY KEY([room_id],[key])
);
