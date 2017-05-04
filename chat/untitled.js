user = {
  name,
  avatar,
  tags: [],
}

friendShip = {
  owner,
  user,
}

room = {
  name,
  desc,
  max,
  tags: [],
}

roomShip = {
  user,
  type: ['rookie', 'member', 'owner'],
}

tag = {
  name,
  desc,
}

message = {
  room,
  user,
}

defaultOpts = {
  createdAt,
  createdBy,
  lastModefiedAt,
  lastModefiedBy,
}