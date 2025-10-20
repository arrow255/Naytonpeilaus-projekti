// src/App.jsx
import { PinInput, Box, VStack, Button } from "@chakra-ui/react"
import { Link } from "react-router-dom"

//TODO: luo huone näkyviin vasta jos kirjautunut? Jos se on järkevä sillee
function App() {
  return (
    <Box bg="yellow.100" minH="100vh" w="100%" p={4}>
      {/* kirjautumis ja huoneen luomis napit */}
      <VStack spacing={3} align="end" mt={1}>
        <Button 
        as={Link} to="/join_room" 
        colorPalette="teal" 
        size="xl" 
        variant="surface"
        >
          Kirjaudu sisään
        </Button>
      </VStack>
        
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="48vh">
        <VStack spacing={7} align="center">
          <Box width="100%" padding="4" color="black" fontSize="3xl">
            Liity opettajan huoneeseen syöttämällä liittymiskoodi:
          </Box>
          
          {/* pin koodi paikka */}
          <PinInput.Root type="alphanumeric" placeholder="" >
            <PinInput.HiddenInput />
            <PinInput.Control>
              <PinInput.Input index={0} w="80px" h="80px" fontSize="3xl" borderWidth="3px" borderColor="black" />
              <Box padding="2"></Box>
              <PinInput.Input index={1} w="80px" h="80px" fontSize="3xl" borderWidth="3px" borderColor="black"/>
              <Box padding="4" fontSize="5xl" lineHeight="40px">-</Box>
              <PinInput.Input index={2} w="80px" h="80px" fontSize="3xl" borderWidth="3px" borderColor="black"/>
              <Box padding="2"></Box>
              <PinInput.Input index={3} w="80px" h="80px" fontSize="3xl" borderWidth="3px" borderColor="black"/>
            </PinInput.Control>
          </PinInput.Root>

          <Box padding="4" color="black" fontSize="3xl" justifyContent="center" alignItems="center">
            TAI
          </Box>

          <Button 
          as={Link} to="/create_room" 
          colorPalette="teal" 
          variant="surface"
          fontSize = {30}
          px={20}
          py={10}
          > 
            Luo huone   
          </Button>

        </VStack>
      </Box>
    </Box>
  )
}

export default App
